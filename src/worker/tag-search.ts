import {
    createRedis,
    shouldQueryMoreArticles,
    workerTagSearchQueue
} from "../backend/redis";
import {queryMoreArticles} from "../utils/api/getArticleIdsByTag";
import createLogger from "../utils/createLogger";

const logger = createLogger("worker:tag-search");

async function doTagSearch(tag: string) {
    if (!(await shouldQueryMoreArticles(tag))) return;

    logger.info("Querying for articles with the tag %s", tag);

    try {
        await queryMoreArticles(tag);
    } catch (err) {
        logger.error(err, "Failed to query articles for tag %s", tag);
    }
}

async function beginWorkerTagSearch(abort?: AbortSignal) {
    const connection = createRedis();

    while (!(abort?.aborted ?? false)) {
        const tag = await workerTagSearchQueue.dequeue(connection);
        await doTagSearch(tag);
    }
}

export function beginTagSearch(workerCount: number, abort?: AbortSignal) {
    logger.info("Beginning tag search with %s workers", workerCount);

    for (let i = 0; i < workerCount; i++) {
        beginWorkerTagSearch(abort);
    }
}
