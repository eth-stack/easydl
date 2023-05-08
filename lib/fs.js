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
exports.validate = exports.rename = exports.fileStats = exports.ls = exports.rm = void 0;
const path = require("path");
const fs = require("fs");
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
