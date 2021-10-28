import {
    getCachedArticleCountStat,
    getCachedAuthorCountStat,
    getCachedTagCountStat,
    setCachedArticleCountStat,
    setCachedAuthorCountStat,
    setCachedTagCountStat
} from "../../backend/redis";
import {getArticleCount, getAuthorCount, getTagCount} from "../database";

/**
 * If the article count stat is cached, returns that value. Otherwise, queries
 * the database, updates the cache, and returns _that_ value.
 */
export async function getMaybeCachedArticleCountStat(): Promise<number> {
    const cached = await getCachedArticleCountStat();
    if (cached) return cached;

    const stat = await getArticleCount();
    await setCachedArticleCountStat(stat);
    return stat;
}

export async function getMaybeCachedTagCountStat(): Promise<number> {
    const cached = await getCachedTagCountStat();
    if (cached) return cached;

    const stat = await getTagCount();
    await setCachedTagCountStat(stat);
    return stat;
}

export async function getMaybeCachedAuthorCountStat(): Promise<number> {
    const cached = await getCachedAuthorCountStat();
    if (cached) return cached;

    const stat = await getAuthorCount();
    await setCachedAuthorCountStat(stat);
    return stat;
}
