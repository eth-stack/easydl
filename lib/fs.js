"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.validate = exports.rename = exports.fileStats = exports.ls = exports.rm = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
function rm(loc) {
    return new Promise((res, rej) => fs.unlink(loc, (err) => {
        if (err)
            return rej(err);
        res();
    }));
}
exports.rm = rm;
function ls(loc) {
    return new Promise((res, rej) => fs.readdir(loc, (err, result) => {
        if (err)
            return rej(err);
        res(result);
    }));
}
exports.ls = ls;
function fileStats(loc) {
    return new Promise((res, rej) => fs.stat(loc, (err, stat) => {
        if (err && err.code === "ENOENT")
            return res(null);
        if (err)
            return rej(err);
        res(stat);
    }));
}
exports.fileStats = fileStats;
function rename(oldPath, newPath) {
    return new Promise((res, rej) => fs.rename(oldPath, newPath, (err) => {
        if (err)
            return rej(err);
        res();
    }));
}
exports.rename = rename;
function validate(loc) {
    return __awaiter(this, void 0, void 0, function* () {
        const parsed = path.parse(loc);
        try {
            const stat = yield fileStats(parsed.dir);
            if (!stat)
                return false;
            return stat.isDirectory();
        }
        catch (e) {
            return false;
        }
    });
}
exports.validate = validate;
