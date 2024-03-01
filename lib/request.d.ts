/// <reference types="node" />
import * as http from "http";
import { EventEmitter } from "events";
interface RequestReadyData {
    statusCode: number;
    headers: http.IncomingHttpHeaders;
}
interface Request extends EventEmitter {
    addListener(event: "ready", listener: (data: RequestReadyData) => void): this;
    addListener(event: "close", listener: () => void): this;
    addListener(event: "data", listener: (chunk: any) => void): this;
    addListener(event: "end", listener: () => void): this;
    addListener(event: "error", listener: (err: Error) => void): this;
    emit(event: "ready", data: RequestReadyData): boolean;
    emit(event: "close"): boolean;
    emit(event: "data", chunk: Buffer): boolean;
    emit(event: "end"): boolean;
    emit(event: "error", err: Error): boolean;
    on(event: "close", listener: () => void): this;
    on(event: "data", listener: (chunk: Buffer) => void): this;
    on(event: "end", listener: () => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "ready", listener: (data: RequestReadyData) => void): this;
    once(event: "ready", listener: (data: RequestReadyData) => void): this;
    once(event: "close", listener: () => void): this;
    once(event: "data", listener: (chunk: any) => void): this;
    once(event: "end", listener: () => void): this;
    once(event: "error", listener: (err: Error) => void): this;
    prependListener(event: "close", listener: () => void): this;
    prependListener(event: "data", listener: (chunk: any) => void): this;
    prependListener(event: "end", listener: () => void): this;
    prependListener(event: "error", listener: (err: Error) => void): this;
    prependListener(event: "ready", listener: (data: RequestReadyData) => void): this;
    prependOnceListener(event: "close", listener: () => void): this;
    prependOnceListener(event: "data", listener: (chunk: any) => void): this;
    prependOnceListener(event: "end", listener: () => void): this;
    prependOnceListener(event: "error", listener: (err: Error) => void): this;
    prependOnceListener(event: "ready", listener: (data: RequestReadyData) => void): this;
    removeListener(event: "close", listener: () => void): this;
    removeListener(event: "data", listener: (chunk: any) => void): this;
    removeListener(event: "end", listener: () => void): this;
    removeListener(event: "error", listener: (err: Error) => void): this;
    removeListener(event: "ready", listener: (data: RequestReadyData) => void): this;
}
declare class Request extends EventEmitter {
    destroyed: boolean;
    address: string;
    options: http.RequestOptions;
    private _end;
    private _engine;
    private _req?;
    constructor(address: string, options?: http.RequestOptions);
    end(): Request;
    wait(): Promise<boolean>;
    pipe(dest: NodeJS.WritableStream): Request;
    destroy(): void;
}
export declare function followRedirect(address: string, opts?: http.RequestOptions): Promise<{
    address: string;
    headers?: http.IncomingHttpHeaders;
}>;
export declare function requestHeader(address: string, options?: http.RequestOptions): Promise<RequestReadyData>;
export default Request;
