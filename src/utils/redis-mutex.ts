import {randomUUID} from "crypto";
import {Redis} from "ioredis";

// language=lua
const EQDEL_SCRIPT = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
    else
        return 0
    end
`;

/**
 * A mutex for Redis. Can be instantiated once for all uses or per use or anywhere in between
 * @param redis The redis connection to use
 * @param key The key to save state in (must not be set outside of here)
 */
export default class RedisMutex {
    constructor(private readonly redis: Redis, private readonly key: string) {}

    /**
     * Attempts to lock the mutex
     * @param timeout Time timeout before the mutex will be unlocked, in ms. Defaults to 10000ms
     * @returns `false` if the mutex couldn't be locked, or a function to release it if it could
     */
    async lock(timeout?: number): Promise<false | (() => Promise<boolean>)> {
        const id = await this.lockAndReturnId(timeout);
        if (id === false) return false;
        return this.release.bind(this, id);
    }

    async isLocked(): Promise<boolean> {
        const exists = await this.redis.exists(this.key);
        return !!exists;
    }

    /**
     * Waits until the mutex has been released, using polling
     * @param pollInterval The interval to poll at in ms. Defaults to 100ms
     */
    wait(pollInterval = 100): Promise<void> {
        // TODO: Polling is probably not the best solution, but I couldn't find a better one
        return new Promise(yay => {
            const interval = setInterval(async () => {
                if (!(await this.isLocked())) {
                    clearInterval(interval);
                    yay();
                }
            }, pollInterval);
        });
    }

    /**
     * Wraps a call in a lock and try/catch
     * @param cb Mutex will remain locked while this callback is still running
     * @param timeout Time timeout before the mutex will be unlocked, in ms. Defaults to 10000ms
     * @returns True if the lock was successful and the callback ran, false if the lock could not be obtained
     */
    async with(cb: () => Promise<void>, timeout?: number): Promise<boolean> {
        const id = await this.lockAndReturnId(timeout);
        if (id === false) return false;

        try {
            await cb();
            return true;
        } finally {
            await this.release(id);
        }
    }

    private async lockAndReturnId(timeout = 10000): Promise<false | string> {
        const id = randomUUID();
        const result = await this.redis.set(this.key, id, "PX", timeout, "NX");

        if (result === "OK") return id;
        else return false;
    }

    private async release(id: string): Promise<boolean> {
        const result = await this.redis.eval(EQDEL_SCRIPT, 1, this.key, id);
        return result === 1;
    }
}
