"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestHeader = exports.followRedirect = void 0;
const http = require("http");
const https = require("https");
const events_1 = require("events");
class Request extends events_1.EventEmitter {
    constructor(address, options) {
        super();
        this.destroyed = false;
        this.address = address;
        this._end = false;
        this.options = Object.assign({
            method: "GET",
        }, options);
        if (address.startsWith("https")) {
            this._engine = https;
        }
        else {
            this._engine = http;
        }
    }
    end() {
        if (this.destroyed)
            throw new Error("Calling start() with a destroyed Request.");
        this._req = this._engine.request(this.address, this.options, (res) => {
            this.emit("ready", {
                statusCode: res.statusCode || 500,
                headers: res.headers,
            });
            res.on("close", () => this.emit("close"));
            res.on("end", () => {
                this._end = true;
                this.emit("end");
            });
            res.on("data", (chunk) => this.emit("data", chunk));
            res.on("error", (error) => this.emit("error", error));
        });
        this._req.on("error", (error) => this.emit("error", error));
        process.nextTick(() => this._req.end());
        return this;
    }
    wait() {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((res) => this.once("close", res));
            return this._end;
        });
    }
    pipe(dest) {
        if (this.destroyed)
            throw new Error("Calling start() with a destroyed Request.");
        this._req = this._engine.request(this.address, this.options, (res) => {
            this.emit("ready", {
                statusCode: res.statusCode || 500,
                headers: res.headers,
            });
            res.pipe(dest);
            res.on("close", () => this.emit("close"));
            res.on("end", () => {
                this._end = true;
                this.emit("end");
            });
            res.on("data", (chunk) => this.emit("data", chunk));
            res.on("error", (error) => this.emit("error", error));
        });
        this._req.on("error", (error) => this.emit("error", error));
        process.nextTick(() => this._req.end());
        return this;
    }
    destroy() {
        this.destroyed = true;
        if (!this._req)
            return;
        this._req.destroy();
    }
}
function followRedirect(address, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const visited = new Set();
        let currentAddress = address;
        while (true) {
            if (visited.has(currentAddress))
                throw new Error(`Infinite redirect is detected at ${currentAddress}`);
            visited.add(currentAddress);
            const { headers, statusCode } = yield requestHeader(currentAddress, opts);
            if (statusCode === 200 || statusCode === 206) {
                return {
                    address: currentAddress,
                    headers,
                };
            }
            else if (statusCode > 300 && statusCode < 400) {
                if (!headers)
                    throw new Error("No header data");
                if (!headers.location)
                    throw new Error(`HTTP Response code is ${statusCode} but "location" is not in headers`);
                currentAddress = headers.location;
            }
            else {
                if (currentAddress !== address)
                    return { address: currentAddress };
                throw new Error(`Got HTTP Response code ${statusCode}`);
            }
        }
    });
}
exports.followRedirect = followRedirect;
function requestHeader(address, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const req = new Request(address, Object.assign({}, options, { method: "HEAD" })).end();
        const res = yield Promise.race([
            new Promise((res) => req.once("ready", res)),
            new Promise((res) => req.once("error", res)),
        ]);
        const code = res.statusCode;
        if (code) {
            return res;
        }
        throw res;
    });
}
exports.requestHeader = requestHeader;
exports.default = Request;
