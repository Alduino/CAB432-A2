import noop from "./noop";

export interface TriggeredPromise<T> {
    promise: Promise<T>;

    resolve(value: T): void;

    reject(error: Error): void;
}

export default function createTriggeredPromise<T>(): TriggeredPromise<T> {
    let resolve: TriggeredPromise<T>["resolve"] = noop;
    let reject: TriggeredPromise<T>["reject"] = noop;

    const promise = new Promise<T>((yay, nay) => {
        resolve = yay;
        reject = nay;
    });

    return {
        promise,
        resolve,
        reject
    };
}
