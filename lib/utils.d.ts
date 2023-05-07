/**
 * Delete all downloaded chunks permanently.
 *
 * @param loc {string} Target file/directory to be cleaned.
 * If directory is given, it will delete all EasyDl chunks in the given directory.
 * Otherwise, it will only delete chunks belonging to the given file.
 */
declare function clean(loc: string): Promise<string[]>;
export { clean };
