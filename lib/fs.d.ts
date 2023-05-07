/// <reference types="node" />
import * as fs from "fs";
export declare function rm(loc: string): Promise<void>;
export declare function ls(loc: string): Promise<string[]>;
export declare function fileStats(loc: string): Promise<fs.Stats | null>;
export declare function rename(oldPath: string, newPath: string): Promise<void>;
export declare function validate(loc: string): Promise<boolean>;
