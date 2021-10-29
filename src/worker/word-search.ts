import {
    createRedis,
    defaultRedis,
    shouldQueryMoreArticlesBySearchWord,
    workerWordSearchQueue
} from "../backend/redis";
import RedisRateLimiter from "../utils/RedisRateLimiter";
import {queryMoreArticlesBySearchWord} from "../utils/api/getArticleIdsBySearchWord";
import createLogger from "../utils/createLogger";

const logger = createLogger("worker:word-search");

const rateLimiter = new RedisRateLimiter(
    defaultRedis,
    "rate-limit:word-search",
    3
);

async function doWordSearch(word: string) {
    if (!(await shouldQueryMoreArticlesBySearchWord(word))) return;

    logger.info("Querying for articles with the tag %s", word);

    try {
        const success = await rateLimiter.trigger(word);
        if (success) await queryMoreArticlesBySearchWord(word);
        else await workerWordSearchQueue.queue(word);
    } catch (err) {
        logger.error(err, "Failed to query articles for tag %s", word);
    }
}

async function beginWorkerWordSearch(abort?: AbortSignal) {
    const connection = createRedis();

    while (!(abort?.aborted ?? false)) {
        const tag = await workerWordSearchQueue.dequeue(connection);
        await doWordSearch(tag);
    }
}

export function beginWordSearch(workerCount: number, abort?: AbortSignal) {
    logger.info("Beginning tag search with %s workers", workerCount);

    for (let i = 0; i < workerCount; i++) {
        beginWorkerWordSearch(abort);
    }
}
