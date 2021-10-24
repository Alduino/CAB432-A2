import createTriggeredPromise from "./createTriggeredPromise";

export type DebounceFunction<T> = (cb: () => T | Promise<T>) => Promise<T>;

type CancelFunction<T> = (v: Promise<T>) => void;

export function createDebounce<T>(time: number): DebounceFunction<T> {
    let cancel: CancelFunction<T> | undefined;

    return cb => {
        const {promise, resolve} = createTriggeredPromise<T>();
        if (cancel) cancel(promise);

        const timeout = setTimeout(async () => {
            const result = await cb();
            resolve(result);
        }, time);

        cancel = wait => {
            clearTimeout(timeout);
            wait.then(resolve);
        };

        return promise;
    };
}
