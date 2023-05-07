import * as fs from "fs";
import * as path from "path";
import { EventEmitter } from "events";
import { delay } from "./helpers";
import { fileStats, validate, rename } from "./fs";
import Request, { followRedirect, requestHeader } from "./request";
export * from "./utils";
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
class EasyDl extends EventEmitter {
    _started = false;
    _destroyed = false;
    _opts;
    _url;
    _dest;
    _reqs = [];
    _attempts = [];
    _ranges = [];
    _done = false;
    _jobs = [];
    _workers = 0;
    _downloadedChunks = 0;
    _totalChunks = 0;
    _partsSpeedRef = [];
    _speedRef = { time: Date.now(), bytes: 0 };
    size = 0;
    isResume = false;
    savedFilePath;
    totalProgress = { speed: 0, bytes: 0, percentage: 0 };
    partsProgress = [];
    finalAddress;
    parallel = true;
    resumable = true;
    headers = null;
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
    constructor(url, dest, options) {
        super();
        this._opts = Object.assign({
            existBehavior: "new_file",
            followRedirect: true,
            connections: 5,
            chunkSize: (size) => {
                return Math.min(size / 10, 10 * 1024 * 1024);
            },
            maxRetry: 3,
            retryDelay: 2000,
            retryBackoff: 3000,
            reportInterval: 2500
        }, options);
        this._url = url;
        this._dest = path.resolve(dest);
        this.savedFilePath = this._dest;
        this._attempts = Array(this._opts.maxRetry)
            .fill(1)
            .map((v, i) => v + i);
        this._start = this._start.bind(this);
        this.finalAddress = url;
    }
    async _ensureDest() {
        while (this.savedFilePath) {
            const stats = await fileStats(this.savedFilePath);
            if (stats && stats.isDirectory()) {
                this.savedFilePath = path.join(this.savedFilePath, path.posix.basename(this._url));
            }
            else if (stats && this._opts.existBehavior === "new_file") {
                const loc = path.parse(this.savedFilePath);
                this.savedFilePath = path.join(loc.dir, `${loc.name}(COPY)${loc.ext}`);
            }
            else if (stats && this._opts.existBehavior === "ignore") {
                this.savedFilePath = null;
            }
            else {
                break;
            }
        }
    }
    async _getHeaders() {
        if (this._opts.followRedirect) {
            const redirResult = await followRedirect(this._url, this._opts.httpOptions);
            this.finalAddress = redirResult.address;
            this.headers = redirResult.headers || null;
        }
        else {
            const headerResult = await requestHeader(this._url, this._opts.httpOptions);
            if (headerResult.statusCode !== 200 && headerResult.statusCode !== 206)
                throw new Error(`Got HTTP response ${headerResult.statusCode}`);
            this.headers = headerResult.headers;
        }
    }
    async _buildFile() {
        if (this._destroyed)
            return;
        try {
            this.emit("build", { percentage: 0 });
            const dest = fs.createWriteStream(this.savedFilePath);
            for (let i = 0; i < this._totalChunks; i += 1) {
                const fileName = `${this.savedFilePath}.$$${i}`;
                const source = fs.createReadStream(fileName);
                await new Promise((res, rej) => {
                    source.pipe(dest, { end: false });
                    source.on("error", rej);
                    dest.on("error", rej);
                    source.on("end", res);
                });
                source.close();
                this.emit("build", {
                    percentage: 100 * (i / this._totalChunks)
                });
            }
            for (let i = 0; i < this._totalChunks; i += 1) {
                const fileName = `${this.savedFilePath}.$$${i}`;
                await new Promise((res) => fs.unlink(fileName, res));
            }
            dest.close();
            this._done = true;
            this.emit("end");
            this.destroy();
        }
        catch (err) {
            this.emit("error", err);
            this.destroy();
        }
    }
    _onChunkCompleted(id) {
        if (!this._reqs[id])
            return;
        this._reqs[id].destroy();
        delete this._reqs[id];
        this._report(id, true);
        this.partsProgress[id].speed = 0;
        this._workers -= 1;
        this._downloadedChunks += 1;
        if (this._downloadedChunks === this._totalChunks)
            return this._buildFile();
        this._processChunks();
    }
    _processChunks() {
        while (!this._destroyed &&
            this._jobs.length &&
            this._workers < this._opts.connections) {
            const id = this._jobs.pop();
            this._download(id, this._ranges[id]);
            this._workers += 1;
        }
    }
    _report(id, force) {
        if (!this._partsSpeedRef[id])
            this._partsSpeedRef[id] = { bytes: 0, time: Date.now() };
        const now = Date.now();
        const interval = this._opts.reportInterval;
        if (force || now - this._partsSpeedRef[id].time > interval) {
            this.partsProgress[id].speed =
                (1000 *
                    (this.partsProgress[id].bytes -
                        this._partsSpeedRef[id].bytes)) /
                    (now - this._partsSpeedRef[id].time);
            this._partsSpeedRef[id].bytes = this.partsProgress[id].bytes;
            this._partsSpeedRef[id].time = now;
        }
        if (force || now - this._speedRef.time > interval) {
            this.totalProgress.speed =
                (1000 * (this.totalProgress.bytes - this._speedRef.bytes)) /
                    (now - this._speedRef.time);
            this._speedRef.bytes = this.totalProgress.bytes;
            this._speedRef.time = now;
            if (this.listenerCount("progress") > 0)
                this.emit("progress", {
                    total: this.totalProgress,
                    details: this.partsProgress
                });
        }
    }
    async _download(id, range) {
        for (let attempt of this._attempts) {
            let opts = this._opts.httpOptions;
            if (opts && opts.headers && range) {
                const headers = Object.assign({}, opts.headers, {
                    Range: `bytes=${range[0]}-${range[1]}`
                });
                opts = Object.assign({}, opts, { headers });
            }
            else if (range) {
                opts = Object.assign({}, opts, {
                    headers: {
                        Range: `bytes=${range[0]}-${range[1]}`
                    }
                });
            }
            this._reqs[id] = new Request(this.finalAddress, opts);
            let size = (range && range[1] - range[0] + 1) || 0;
            const fileName = `${this.savedFilePath}.$$${id}$PART`;
            let error = null;
            const dest = fs.createWriteStream(fileName);
            dest.on("error", (err) => {
                if (this._destroyed)
                    return;
                this.emit("error", err);
            });
            await this._reqs[id]
                .once("ready", ({ statusCode, headers }) => {
                if (statusCode !== 206 && statusCode !== 200) {
                    error = new Error(`Got HTTP Status code ${statusCode} when downloading chunk ${id}`);
                    this._reqs[id].destroy();
                    return;
                }
                const contentLength = (headers["content-length"] &&
                    parseInt(headers["content-length"])) ||
                    0;
                if (size && contentLength && size !== contentLength) {
                    error = new Error(`Expecting content length of ${size} but got ${contentLength} when downloading chunk ${id}`);
                    this._reqs[id].destroy();
                    return;
                }
                if (range && statusCode !== 206) {
                    error = new Error(`Expecting HTTP Status code 206 but got ${statusCode} when downloading chunk ${id}`);
                    this._reqs[id].destroy();
                    return;
                }
                if (!size && headers["content-length"])
                    size = parseInt(headers["content-length"]);
                if (!this.size && id === 0 && headers["content-length"])
                    this.size = parseInt(headers["content-length"]);
            })
                .on("data", (data) => {
                this.partsProgress[id].bytes += data.length;
                this.partsProgress[id].percentage = size
                    ? (100 * this.partsProgress[id].bytes) / size
                    : 0;
                this.totalProgress.bytes += data.length;
                this.totalProgress.percentage = this.size
                    ? (100 * this.totalProgress.bytes) / this.size
                    : 0;
                this._report(id);
            })
                .on("error", (err) => {
                if (this._destroyed)
                    return;
                this.emit("error", err);
            })
                .pipe(dest)
                .wait();
            if (this._destroyed)
                return;
            if (!error) {
                await rename(`${this.savedFilePath}.$$${id}$PART`, `${this.savedFilePath}.$$${id}`).catch((e) => {
                    this.emit("error", e);
                });
                this._onChunkCompleted(id);
                return;
            }
            this.emit("retry", {
                chunkId: id,
                attempt,
                error
            });
            await delay(this._opts.retryDelay +
                this._opts.retryBackoff * (attempt - 1));
        }
        this.emit("error", new Error(`Failed to download chunk #${id} ${range}`));
        this.destroy();
    }
    async _syncJobs() {
        this.partsProgress = Array(this._ranges.length);
        for (let i = 0; i < this._ranges.length; i += 1) {
            this.partsProgress[i] = {
                speed: 0,
                bytes: 0,
                percentage: 0
            };
            const stats = await fileStats(`${this.savedFilePath}.$$${i}`);
            if (!stats) {
                this._jobs.push(i);
                continue;
            }
            const size = this._ranges[i][1] - this._ranges[i][0] + 1;
            if (stats.size > size)
                throw new Error(`Expecting maximum chunk size of ${size} but got: ${stats.size}`);
            if (stats.size === size) {
                this._downloadedChunks += 1;
                this.partsProgress[i].percentage = 100;
                this.partsProgress[i].bytes = size;
                this.totalProgress.bytes += size;
                this.totalProgress.percentage = this.size
                    ? (100 * this.totalProgress.bytes) / this.size
                    : 0;
                this.isResume = true;
            }
            else {
                this._jobs.push(i);
            }
        }
    }
    _calcRanges() {
        let chunkSize = typeof this._opts.chunkSize === "function"
            ? Math.floor(this._opts.chunkSize(this.size))
            : this._opts.chunkSize;
        let extraSize = 0;
        if (this.size / chunkSize < this._opts.connections) {
            chunkSize = Math.floor(this.size / this._opts.connections);
            extraSize = this.size % this._opts.connections;
        }
        const n = extraSize
            ? Math.floor(this.size / chunkSize)
            : Math.ceil(this.size / chunkSize);
        const chunks = Array(n);
        for (let i = 0; i < n; i += 1) {
            if (i < n - 1)
                chunks[i] = chunkSize;
            else
                chunks[i] = this.size - (n - 1) * chunkSize - extraSize;
            if (i < extraSize)
                chunks[i] += 1;
        }
        if (n > 1 && chunks[n - 1] < chunkSize / 2) {
            const diff = Math.floor(chunkSize / 2 - chunks[n - 1]);
            chunks[n - 1] += diff;
            chunks[n - 2] -= diff;
        }
        let sum = 0;
        for (let i = 0; i < n; i += 1) {
            const chunk = chunks[i];
            this._ranges.push([sum, sum + chunk - 1]);
            sum += chunk;
        }
    }
    async _start() {
        if (this._started)
            return;
        this._started = true;
        if (this._destroyed)
            throw new Error("Calling start() of a destroyed instance");
        try {
            await this._ensureDest();
            if (!this.savedFilePath)
                return;
            if (!(await validate(this.savedFilePath)))
                throw new Error(`Invalid output destination ${this._dest}`);
            await this._getHeaders();
            if (this._opts.connections !== 1 &&
                this.headers &&
                this.headers["content-length"] &&
                this.headers["accept-ranges"] === "bytes") {
                this.size = parseInt(this.headers["content-length"]);
                this._calcRanges();
                await this._syncJobs();
                this._totalChunks = this._ranges.length;
                if (!this._jobs.length)
                    this._buildFile();
                else
                    this._processChunks();
            }
            else {
                if (this.headers && this.headers["content-length"])
                    this.size = parseInt(this.headers["content-length"]);
                this.resumable = false;
                this.parallel = false;
                this.partsProgress = [
                    {
                        speed: 0,
                        bytes: 0,
                        percentage: 0
                    }
                ];
                this._totalChunks = 1;
                this._download(0);
            }
            if (this.listenerCount("metadata") > 0) {
                this.emit("metadata", {
                    size: this.size,
                    chunks: this._ranges.map(([a, b]) => b - a + 1),
                    isResume: this.isResume,
                    progress: this.partsProgress.map((progress) => progress.percentage),
                    finalAddress: this.finalAddress,
                    parallel: this.parallel,
                    resumable: this.resumable,
                    headers: this.headers,
                    savedFilePath: this.savedFilePath
                });
            }
        }
        catch (err) {
            this.emit("error", err);
            this.destroy();
        }
    }
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
    async metadata() {
        process.nextTick(this._start);
        if (this._destroyed)
            throw new Error("Calling metadata() on destroyed instance.");
        return await new Promise((res, rej) => {
            this.once("error", rej);
            this.once("metadata", res);
        });
    }
    /**
     * Wait until the download has finished, failed, or cancelled.
     *
     * @async
     * @returns {boolean} `true` indicates that the download is success, `false` is
     * returned if the download is cancelled by user.
     * @throws {Error} when download failed.
     */
    async wait() {
        process.nextTick(this._start);
        if (this._destroyed)
            return this._done;
        await new Promise((res, rej) => {
            this.once("error", rej);
            this.once("close", res);
        });
        return this._done;
    }
    start() {
        process.nextTick(this._start);
        return this;
    }
    destroy() {
        if (this._destroyed)
            return;
        this._destroyed = true;
        for (let req of this._reqs) {
            if (!req)
                continue;
            try {
                req.destroy();
            }
            catch (e) { }
        }
        this.emit("close");
    }
}
<<<<<<< HEAD
module.exports = EasyDl;
=======
export default EasyDl;
<<<<<<< HEAD
//# sourceMappingURL=index.js.map
>>>>>>> a330aea (Add lib)
=======
>>>>>>> 14f1b9e (Update typing)
