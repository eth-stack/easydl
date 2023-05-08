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
exports.clean = void 0;
const path = require("path");
const fs_1 = require("./fs");
/**
 * Delete all downloaded chunks permanently.
 *
 * @param loc {string} Target file/directory to be cleaned.
 * If directory is given, it will delete all EasyDl chunks in the given directory.
 * Otherwise, it will only delete chunks belonging to the given file.
 */
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
