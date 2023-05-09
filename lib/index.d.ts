/// <reference types="node" />
/// <reference types="node" />
import * as http from "http";
import { EventEmitter } from "events";
/** The configurable download options. */
interface Options {
    /** Number of parallel connections */
    connections?: number;
    /** What to do if the destination file exists:
     * - `overwrite` will overwrite existing file (you will lost the current file)
     * -`new_file` will append a `(COPY)` name to the downloaded file until the file does not exist
     * -`ignore` will stop this current download
     */
    existBehavior?: "overwrite" | "new_file" | "ignore";
    /** Whether `EasyDl` should follow HTTP redirection. */
    followRedirect?: boolean;
    /** Options passed to the http client */
    httpOptions?: http.RequestOptions;
    /** The size of chunks of the file. It accepts a static value (number), or a function with this signature: `(size: number) => number` */
    chunkSize?: number | {
        (size: number): number;
    };
    /** Maximum number of retries when error occured */
    maxRetry?: number;
    /** Delay before attempting to retry in ms  */
    retryDelay?: number;
    /** Incremental back-off after each retry in ms */
    retryBackoff?: number;
    /** Set how frequent `progress` event emitted by `EasyDL`  */
    reportInterval?: number;
}
interface RetryInfo {
    chunkId: number;
    attempt: number;
    error: Error;
}
interface Progress {
    speed?: number;
    bytes?: number;
    percentage: number;
}
interface ProgressReport {
    total: Progress;
    details: Progress[];
}
interface Metadata {
    /** Size of the file in bytes */
    size: number;
    /** Array containing the size of each chunks */
    chunks: number[];
    /** Indicates if this instance is using previously downloaded chunks */
    isResume: boolean;
    /** Current progress of each chunks in percent. Values should be 0 or 100 only. */
    progress: number[];
    /** Final URL address of the file. It will be different from the supplied URL param if there is some redirection. */
    finalAddress: string;
    /** Indicates if this instance uses multiple-connection to perform downloads */
    parallel: boolean;
    /** Indicates if the server supports resuming. Some servers simply don't support/allow it. */
    resumable: boolean;
    /** Raw HTTP response headers */
    headers: http.IncomingHttpHeaders | null;
    /** The final file path. It may be different from the supplied dest param
     * if you supplied directory as the dest param or you use "new_file" as the existBehavior.  */
    savedFilePath: string;
}
interface EasyDl extends EventEmitter {
    addListener(event: "progress", listener: (data: ProgressReport) => void): this;
    addListener(event: "build", listener: (progress: Progress) => void): this;
    addListener(event: "metadata", listener: (data: Metadata) => void): this;
    addListener(event: "retry", listener: (data: RetryInfo) => void): this;
    addListener(event: "close", listener: () => void): this;
    addListener(event: "end", listener: () => void): this;
    addListener(event: "error", listener: (err: Error) => void): this;
    emit(event: "build", data: Progress): boolean;
    emit(event: "metadata", data: Metadata): boolean;
    emit(event: "progress", data: ProgressReport): boolean;
    emit(event: "retry", data: RetryInfo): boolean;
    emit(event: "close"): boolean;
    emit(event: "end"): boolean;
    emit(event: "error", err: Error): boolean;
    /** Emitted when all chunks are downloaded and the file is being built by merging chunks together. */
    on(event: "build", listener: (progress: Progress) => void): this;
    /** Emitted when the download metadata is ready to be used */
    on(event: "metadata", listener: (data: Metadata) => void): this;
    /** The current download progress */
    on(event: "progress", listener: (data: ProgressReport) => void): this;
    /** Emitted when the instance is closed and being destroyed */
    on(event: "close", listener: () => void): this;
    /** The `end` event is emitted after the download had finished and the file being downloaded is ready. */
    on(event: "end", listener: () => void): this;
    /** Emitted when an error occured */
    on(event: "error", listener: (err: Error) => void): this;
    /** Emitted when EasyDL performed a retry */
    on(event: "retry", listener: (data: RetryInfo) => void): this;
    once(event: "build", listener: (progress: Progress) => void): this;
    once(event: "metadata", listener: (data: Metadata) => void): this;
    once(event: "progress", listener: (data: ProgressReport) => void): this;
    once(event: "retry", listener: (data: RetryInfo) => void): this;
    once(event: "close", listener: () => void): this;
    once(event: "end", listener: () => void): this;
    once(event: "error", listener: (err: Error) => void): this;
    prependListener(event: "build", listener: (progress: Progress) => void): this;
    prependListener(event: "metadata", listener: (data: Metadata) => void): this;
    prependListener(event: "progress", listener: (data: ProgressReport) => void): this;
    prependListener(event: "retry", listener: (data: RetryInfo) => void): this;
    prependListener(event: "close", listener: () => void): this;
    prependListener(event: "end", listener: () => void): this;
    prependListener(event: "error", listener: (err: Error) => void): this;
    prependOnceListener(event: "build", listener: (progress: Progress) => void): this;
    prependOnceListener(event: "metadata", listener: (data: Metadata) => void): this;
    prependOnceListener(event: "progress", listener: (data: ProgressReport) => void): this;
    prependOnceListener(event: "retry", listener: (data: RetryInfo) => void): this;
    prependOnceListener(event: "close", listener: () => void): this;
    prependOnceListener(event: "end", listener: () => void): this;
    prependOnceListener(event: "error", listener: (err: Error) => void): this;
    removeListener(event: "build", listener: (progress: Progress) => void): this;
    removeListener(event: "metadata", listener: (data: Metadata) => void): this;
    removeListener(event: "progress", listener: (data: ProgressReport) => void): this;
    removeListener(event: "retry", listener: (data: RetryInfo) => void): this;
    removeListener(event: "close", listener: () => void): this;
    removeListener(event: "end", listener: () => void): this;
    removeListener(event: "error", listener: (err: Error) => void): this;
}
/**
 * Easily download a file and save it to local disk. It supports resuming previously
 * downloaded files, multi-connection downloads, and retry on fail out of the box!
 *
 * @class
 * @remarks
 *  **Quick start** :
 *
 * To use the `EasyDl` simply use the following:
 * ```ts
 * // event based
 * const easydl = new EasyDl(url, dest)
 *   .on('error', (err) => {
 *     console.log('error!', err);
 *     // handle error
 *   })
 *   .on('end', () => {
 *     console.log('download success!');
 *   })
 *   .start();
 *
 * // async-await
 * try {
 *   const downloaded = await new EasyDl(url, dest).wait();
 *   if (downloaded) console.log('file is downloaded!');
 * } catch (e) {
 *   console.log('error', e);
 * }
 *
 * // promise
 * new EasyDl(url, dest)
 *   .then(success => {
 *      if (success) console.log('file is downloaded!');
 *   })
 *   .catch(err => {
 *      console.log('error', err);
 *   })
 * ```
 *
 * For advanced usages, such as handling progress information please see [DOCS](https://github.com/andresusanto/easydl)
 */
declare class EasyDl extends EventEmitter {
    private _started;
    private _destroyed;
    private _opts;
    private _url;
    private _dest;
    private _reqs;
    private _attempts;
    private _ranges;
    private _done;
    private _jobs;
    private _workers;
    private _downloadedChunks;
    private _totalChunks;
    private _partsSpeedRef;
    private _speedRef;
    size: number;
    isResume: boolean;
    savedFilePath: string | null;
    totalProgress: Progress;
    partsProgress: Progress[];
    finalAddress: string;
    parallel: boolean;
    resumable: boolean;
    headers: http.IncomingHttpHeaders | null;
    /**
     * @param {string} url URL of the file to be downloaded
     * @param {string} dest A local file/folder as the output of the download. If a folder is supplied (for example `~/`),
     * it will add the file name automaticaly.
     * @param {Options} options Configurable download options:
     * - `connections` - Number of parallel connections
     * - `existBehavior` - What to do if the destination file exists ([details](https://github.com/andresusanto/easydl))
     * - `followRedirect` - Whether `EasyDl` should follow HTTP redirection.
     * - `httpOptions` - Options passed to the http client
     * - `chunkSize` - The size of chunks of the file. ([details](https://github.com/andresusanto/easydl))
     * - `maxRetry` - Maximum number of retries when error occured
     * - `retryDelay` - Delay before attempting to retry in ms
     * - `retryBackoff` - Incremental back-off after each retry in ms
     * - `reportInterval` - Set how frequent `progress` event emitted by `EasyDL`
     */
    constructor(url: string, dest: string, options?: Options);
    private _ensureDest;
    private _getHeaders;
    private _buildFile;
    private _onChunkCompleted;
    private _processChunks;
    private _report;
    private _download;
    private _syncJobs;
    private _calcRanges;
    private _start;
    /**
     * Start the downloads and wait for its metadata.
     *
     * @async
     * @returns {Metadata} Metadata object for the current download
     * @remarks
     * Using async await
     * ```ts
     * const metadata = await new EasyDl('url', './').metadata();
     * ```
     *
     * Using promise
     * ```ts
     * new EasyDl('url', './')
     *    .metadata()
     *    .then(meta => {
     *        // do something
     *    })
     * ```
     */
    metadata(): Promise<Metadata>;
    /**
     * Wait until the download has finished, failed, or cancelled.
     *
     * @async
     * @returns {boolean} `true` indicates that the download is success, `false` is
     * returned if the download is cancelled by user.
     * @throws {Error} when download failed.
     */
    wait(): Promise<boolean>;
    start(): EasyDl;
    destroy(): void;
}
export = EasyDl;
