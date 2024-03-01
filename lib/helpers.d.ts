export declare function delay(ms: number): Promise<void>;
export declare function safeRun<T extends (...args: any) => any>(fn: T): void;
