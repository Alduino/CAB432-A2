import {Redis} from "ioredis";
import createLogger from "./createLogger";

const logger = createLogger("RedisUniqueQueue");

/**
 * A queue that only lets each item exist once
 * @param redis A connection to Redis that will be used for general queries, but
 *              not for `dequeue()`
 * @param key The path to where the required values will be saved in Redis
 */
export default class RedisUniqueQueue {
    /**
     * The actual list that items are added to and popped from
     * @private
     */
    private readonly listKey: string;

    /**
     * A set to check if items exist already in the list or not
     * @private
     */
    private readonly indexKey: string;

    constructor(private readonly redis: Redis, private readonly key: string) {
        this.listKey = `${key}:list`;
        this.indexKey = `${key}:index`;
    }

    /**
     * Returns true if the item is in the queue, false if it is not
     */
    isQueued(value: string): Promise<boolean> {
        return this.redis
            .sismember(this.indexKey, value)
            .then(res => res === 1);
    }

    getSize(): Promise<number> {
        return this.redis.scard(this.indexKey);
    }

    /**
     * Attempts to add an item to the queue. If it already exists, it will not
     * be added again, and `false` will be returned. Otherwise, it will be added
     * and `true` will be returned.
     */
    async queue(value: string): Promise<boolean> {
        logger.debug("Adding to queue %s the value %s", this.key, value);
        const addedToIndex = await this.redis.sadd(this.indexKey, value);
        if (!addedToIndex) return false;
        await this.redis.lpush(this.listKey, value);
        return true;
    }

    /**
     * Waits until there is a value in the queue, and returns it once it arrives
     * @param connection A new Redis connection that is not used elsewhere, as
     *                   it will be blocked by this call
     */
    async dequeue(connection: Redis): Promise<string> {
        logger.debug("Waiting for an item to be read from %s", this.key);
        const [, value] = await connection.brpop(this.listKey, 0);
        await this.redis.srem(this.indexKey, value);
        logger.debug("Read an item from %s with the value %s", this.key, value);
        return value;
    }
}
