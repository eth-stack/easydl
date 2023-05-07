<<<<<<< HEAD
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
exports.clean = void 0;
const path = __importStar(require("path"));
const fs_1 = require("./fs");
=======
import * as path from "path";
import { rm, ls, fileStats } from "./fs";
>>>>>>> a330aea (Add lib)
/**
 * Delete all downloaded chunks permanently.
 *
 * @param loc {string} Target file/directory to be cleaned.
 * If directory is given, it will delete all EasyDl chunks in the given directory.
 * Otherwise, it will only delete chunks belonging to the given file.
 */
<<<<<<< HEAD
function clean(loc) {
    return __awaiter(this, void 0, void 0, function* () {
        let targetFile = null;
        let stats = null;
        let targetFolder = loc;
        stats = yield (0, fs_1.fileStats)(loc);
        if (!stats) {
            const parsed = path.parse(loc);
            targetFile = parsed.base;
            targetFolder = parsed.dir;
            stats = yield (0, fs_1.fileStats)(parsed.dir);
        }
        if (!stats || !stats.isDirectory())
            throw new Error(`Invalid location ${loc}.`);
        const files = yield (0, fs_1.ls)(targetFolder);
        const deleted = [];
        const regex = /(.+)\.\$\$[0-9]+(\$PART)?$/;
        for (let file of files) {
            const cap = regex.exec(file);
            if (!cap || (targetFile !== null && cap[1] !== targetFile))
                continue;
            const fullPath = path.join(targetFolder, file);
            yield (0, fs_1.rm)(fullPath);
            deleted.push(fullPath);
        }
        return deleted;
    });
}
exports.clean = clean;
=======
async function clean(loc) {
    let targetFile = null;
    let stats = null;
    let targetFolder = loc;
    stats = await fileStats(loc);
    if (!stats) {
        const parsed = path.parse(loc);
        targetFile = parsed.base;
        targetFolder = parsed.dir;
        stats = await fileStats(parsed.dir);
    }
    if (!stats || !stats.isDirectory())
        throw new Error(`Invalid location ${loc}.`);
    const files = await ls(targetFolder);
    const deleted = [];
    const regex = /(.+)\.\$\$[0-9]+(\$PART)?$/;
    for (let file of files) {
        const cap = regex.exec(file);
        if (!cap || (targetFile !== null && cap[1] !== targetFile))
            continue;
        const fullPath = path.join(targetFolder, file);
        await rm(fullPath);
        deleted.push(fullPath);
    }
    return deleted;
}
export { clean };
//# sourceMappingURL=utils.js.map
>>>>>>> a330aea (Add lib)
