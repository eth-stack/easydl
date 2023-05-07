import * as path from "path";
import { rm, ls, fileStats } from "./fs";
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
<<<<<<< HEAD
//# sourceMappingURL=utils.js.map
>>>>>>> a330aea (Add lib)
=======
>>>>>>> 14f1b9e (Update typing)
