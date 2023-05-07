import * as path from "path";
import * as fs from "fs";
export function rm(loc) {
    return new Promise((res, rej) => fs.unlink(loc, (err) => {
        if (err)
            return rej(err);
        res();
    }));
}
export function ls(loc) {
    return new Promise((res, rej) => fs.readdir(loc, (err, result) => {
        if (err)
            return rej(err);
        res(result);
    }));
}
export function fileStats(loc) {
    return new Promise((res, rej) => fs.stat(loc, (err, stat) => {
        if (err && err.code === "ENOENT")
            return res(null);
        if (err)
            return rej(err);
        res(stat);
    }));
}
export function rename(oldPath, newPath) {
    return new Promise((res, rej) => fs.rename(oldPath, newPath, (err) => {
        if (err)
            return rej(err);
        res();
    }));
}
export async function validate(loc) {
    const parsed = path.parse(loc);
    try {
        const stat = await fileStats(parsed.dir);
        if (!stat)
            return false;
        return stat.isDirectory();
    }
    catch (e) {
        return false;
    }
}
//# sourceMappingURL=fs.js.map