import {Redis} from "ioredis";
import createLogger from "./createLogger";

const logger = createLogger("RedisRateLimiter");

/**
 * Rate limits calls to `trigger()`. If the rate limit is hit, `trigger()` will wait until it is not any more.
 * @param redis The redis connection to use
 * @param key The key to save the rate limit information at
 * @param maxCount The maximum number of requests that can occur per ten seconds
 */
export default class RedisRateLimiter {
    private readonly script: string;

    constructor(
        private readonly redis: Redis,
        private readonly key: string,
        private readonly maxCount: number
    ) {
        // Based on https://redis.io/commands/incr#pattern-rate-limiter-2
        // language=lua
        this.script = `
            local current
            current = redis.call("incr", KEYS[1])
            if current == 1 then
                redis.call("expire", KEYS[1], 10)
            end
        `;
    }

    private async attempt(): Promise<boolean> {
        const current = await this.redis.get(this.key);

        if (parseInt(current) > this.maxCount) return false;

        await this.redis.eval(this.script, 1, this.key);
        return true;
    }

    /**
     * If the rate limiter has too many items, will poll to wait until it doesn't
     * @param description Some way to uniquely identify this call for logging
     * @param checkInterval The interval to check if the rate limit can be
     * @param cancelTimeout Once this timeout passes, the function will exit and return false. Set to zero to ignore.
     */
    async trigger(description: string, checkInterval = 500, cancelTimeout = 30000): Promise<boolean> {
        const initialAttempt = await this.attempt();

        if (!initialAttempt) {
            return await new Promise<boolean>(yay => {
                const interval = setInterval(async () => {
                    const attempt = await this.attempt();

                    if (attempt) {
                        logger.trace("Caught rate limit at %s after waiting for it to clear (%s)", this.key, description);
                        clearInterval(interval);
                        clearTimeout(timeout);
                        yay(true);
                    }
                }, checkInterval);

                const timeout =
                    cancelTimeout &&
                    setTimeout(() => {
                        logger.warn("A consumer of the rate limit at %s timed out (%s)", this.key, description);
                        clearInterval(interval);
                        clearTimeout(timeout);
                        yay(false);
                    }, cancelTimeout);
            });
        } else {
            logger.trace("Caught rate limit at %s before it filled up (%s)", this.key, description);
            return true;
        }
    }
}
