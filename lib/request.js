import * as http from "http";
import * as https from "https";
import { EventEmitter } from "events";
class Request extends EventEmitter {
    destroyed;
    address;
    options;
    _end;
    _engine;
    _req;
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
    async wait() {
        await new Promise((res) => this.once("close", res));
        return this._end;
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
export async function followRedirect(address, opts) {
    const visited = new Set();
    let currentAddress = address;
    while (true) {
        if (visited.has(currentAddress))
            throw new Error(`Infinite redirect is detected at ${currentAddress}`);
        visited.add(currentAddress);
        const { headers, statusCode } = await requestHeader(currentAddress, opts);
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
}
export async function requestHeader(address, options) {
    const req = new Request(address, Object.assign({}, options, { method: "HEAD" })).end();
    const res = await Promise.race([
        new Promise((res) => req.once("ready", res)),
        new Promise((res) => req.once("error", res)),
    ]);
    const code = res.statusCode;
    if (code) {
        return res;
    }
    throw res;
}
export default Request;
//# sourceMappingURL=request.js.map