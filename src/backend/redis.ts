import {ok as assert} from "assert";
import IORedis, {Redis} from "ioredis";
import Article from "../api-types/Article";
import RedisMutex from "../utils/RedisMutex";
import RedisUniqueQueue from "../utils/RedisUniqueQueue";

export function createRedis(): Redis {
    return new IORedis(process.env.REDIS_HOST, {enableAutoPipelining: true});
}

/**
 * A default Redis connection to use for non-blocking queries
 */
export const defaultRedis = createRedis();

function getArticleByIdKey(articleId: string) {
    return `article:${articleId.substring(0, 2)}:${articleId.substring(2)}`;
}

export async function getCachedArticleById(
    articleId: string
): Promise<Article | null> {
    const key = getArticleByIdKey(articleId);
    return JSON.parse(await defaultRedis.get(key));
}

export async function setCachedArticleById(article: Article): Promise<void> {
    const key = getArticleByIdKey(article.id);
    await defaultRedis.set(key, JSON.stringify(article), "EX", 3600, "NX");
}

export function getSearchWordKey(word: string) {
    return `word:${word}:usages`;
}

export function getCachedArticleIdsBySearchWord(word: string): Promise<string[]> {
    const key = getSearchWordKey(word);
    return defaultRedis.smembers(key);
}

export async function addCachedArticleIdsToSearchWord(word: string, ids: string[]) {
    const key = getSearchWordKey(word);
    await defaultRedis.sadd(key, ...ids);
    await defaultRedis.expire(key, 3600);
}

function getSearchWordCheckKey(word: string) {
    return `word:${word}:check`;
}

/**
 * Checks if articles for this word specifically have been queried in the last
 * hour
 */
export async function shouldQueryMoreArticlesBySearchWord(word: string): Promise<boolean> {
    const key = getSearchWordCheckKey(word);
    const valuesKey = getTagKey(word);
    if (!await defaultRedis.exists(key)) return true;
    return await defaultRedis.scard(valuesKey) < 10;
}

export async function setQueriedMoreArticlesBySearchWord(word: string): Promise<void> {
    const key = getSearchWordCheckKey(word);
    await defaultRedis.set(key, 1);
    await defaultRedis.expire(key, 3600);
}

export async function unsetQueriedMoreArticlesBySearchWord(word: string): Promise<void> {
    const key = getSearchWordCheckKey(word);
    await defaultRedis.del(key);
}

function getTagKey(tag: string) {
    return `tag:${tag}:usages`;
}

export function getCachedArticleIdsByTag(tag: string): Promise<string[]> {
    const key = getTagKey(tag);
    return defaultRedis.smembers(key);
}

export async function addCachedArticleIdsToTag(
    tag: string,
    ids: string[]
): Promise<void> {
    const key = getTagKey(tag);
    await defaultRedis.sadd(key, ...ids);
    await defaultRedis.expire(key, 3600);
}

function getTagCheckKey(tag: string) {
    return `tag:${tag}:check`;
}

/**
 * Checks if articles for this tag specifically have been queried in the last
 * hour
 */
export async function shouldQueryMoreArticlesByTag(tag: string): Promise<boolean> {
    const key = getTagCheckKey(tag);
    const valuesKey = getTagKey(tag);
    if (!await defaultRedis.exists(key)) return true;
    return await defaultRedis.scard(valuesKey) < 10;
}

export async function setQueriedMoreArticlesByTag(tag: string): Promise<void> {
    const key = getTagCheckKey(tag);
    await defaultRedis.set(key, 1);
    await defaultRedis.expire(key, 3600);
}

export async function unsetQueriedMoreArticlesByTag(tag: string): Promise<void> {
    const key = getTagCheckKey(tag);
    await defaultRedis.del(key);
}

function getSourceIdToArticleIdKey(
    sourceName: string,
    sourceId: string
): string {
    return `source:${sourceName}:${sourceId}:article-id`;
}

function getSourceIdToArticleIdMutex(
    sourceName: string,
    sourceId: string
): RedisMutex {
    return new RedisMutex(
        defaultRedis,
        `${getSourceIdToArticleIdKey(sourceName, sourceId)}:mutex`
    );
}

export function getCachedArticleIdBySourceId(
    sourceName: string,
    sourceId: string
): Promise<string | null> {
    const key = getSourceIdToArticleIdKey(sourceName, sourceId);
    return defaultRedis.get(key);
}

/**
 * Same as `getCachedArticleIdBySourceId`, but if there is no value, it will call `inLock` to generate it, and will only
 * allow one call to `inLock` per `sourceName`/`sourceId` combination while the value is cached.
 * @param sourceName The source of the article
 * @param sourceId The identifier the source uses to reference the article
 * @param inLock A function that is called when the lock opens, and should return the new value
 */
export async function getCachedArticleIdBySourceIdOrLock(
    sourceName: string,
    sourceId: string,
    inLock: () => Promise<string>
): Promise<string | null> {
    const key = getSourceIdToArticleIdKey(sourceName, sourceId);

    // if it already has a value, we don't need to do anything special
    const hasValue = await defaultRedis.exists(key);
    if (hasValue) {
        const cachedValue = await getCachedArticleIdBySourceId(sourceName, sourceId);
        if (cachedValue) return cachedValue;
    }

    const mutex = getSourceIdToArticleIdMutex(sourceName, sourceId);

    // otherwise, if it is already locked, wait for that to complete and then
    const isLocked = await mutex.isLocked();
    if (isLocked) {
        await mutex.wait();
        const cachedValue = await getCachedArticleIdBySourceId(sourceName, sourceId);
        if (cachedValue) return cachedValue;
    }

    // it was not locked when we last checked, so lock it and run `inLock`
    let resultId: string | null;
    const successful = await mutex.with(async () => {
        // one final check to see if we have a value now (at this point, nothing else can set the value so this is safe)
        if (await defaultRedis.exists(key)) return;

        const value = await inLock();

        await setCachedArticleIdBySourceId(sourceName, sourceId, value);
        resultId = value;
    });

    assert(successful, `could not lock the mutex for ${sourceName}:${sourceId}`);
    return resultId;
}

export async function setCachedArticleIdBySourceId(
    sourceName: string,
    sourceId: string,
    articleId: string
): Promise<void> {
    const key = getSourceIdToArticleIdKey(sourceName, sourceId);
    await defaultRedis.set(key, articleId);
    await defaultRedis.expire(key, 3600);
}

export const workerTagSearchQueue = new RedisUniqueQueue(defaultRedis, "worker:queue:worker-tag-search");
export const tagDiscoveryQueue = new RedisUniqueQueue(defaultRedis, "worker:queue:tag-discovery");

/**
 * Waits until there `count` are items in the tag discovery queue, and returns
 * them for processing (removing them from the queue)
 */
export async function dequeueArticlesForTagDiscovery(
    connection: Redis,
    count: number
): Promise<string[]> {
    const items = new Array(count);

    for (let i = 0; i < count; i++) {
        items[i] = await tagDiscoveryQueue.dequeue(connection);
    }

    return items;
}

function getArticleCountStatKey() {
    return `stats:article-count`;
}

export async function getCachedArticleCountStat(): Promise<number | null> {
    const key = getArticleCountStatKey();
    const items = await defaultRedis.get(key);
    if (items) return parseInt(items) || null;
    return null;
}

export async function setCachedArticleCountStat(count: number): Promise<void> {
    const key = getArticleCountStatKey();
    await defaultRedis.set(key, count, "EX", 30);
}

function getTagCountStatKey() {
    return `stats:tag-count`;
}

export async function getCachedTagCountStat(): Promise<number | null> {
    const key = getTagCountStatKey();
    const items = await defaultRedis.get(key);
    if (items) return parseInt(items) || null;
    return null;
}

export async function setCachedTagCountStat(count: number): Promise<void> {
    const key = getTagCountStatKey();
    await defaultRedis.set(key, count, "EX", 600);
}

function getAuthorCountStatKey() {
    return `stats:author-count`;
}

export async function getCachedAuthorCountStat(): Promise<number | null> {
    const key = getAuthorCountStatKey();
    const items = await defaultRedis.get(key);
    if (items) return parseInt(items) || null;
    return null;
}

export async function setCachedAuthorCountStat(count: number): Promise<void> {
    const key = getAuthorCountStatKey();
    await defaultRedis.set(key, count, "EX", 600);
}
