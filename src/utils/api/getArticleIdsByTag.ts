import {isApiError} from "../../api-types/ApiError";
import {
    getCachedArticleIdsByTag,
    setQueriedMoreArticlesByTag,
    shouldQueryMoreArticlesByTag,
    unsetQueriedMoreArticlesByTag
} from "../../backend/redis";
import {getArticleIdsByTag as getDatabaseArticleIdsByTag} from "../database";
import {querySearchers} from "./querySearchers";
import {resolveArticleBySource} from "./resolveArticleBySource";

/**
 * Queries every source to find new articles with the specified tag. You should
 * first check if this actually needs to run, with `shouldQueryMoreArticles`.
 * @returns The IDs of the articles that were discovered
 */
export async function queryMoreArticlesByTag(tag: string): Promise<string[]> {
    await setQueriedMoreArticlesByTag(tag);

    try {
        const sourceIds = await querySearchers(searcher =>
            searcher.getSourceIdsByTag?.(tag)
        );

        return await Promise.all(sourceIds.map(resolveArticleBySource)).then(
            res => res.filter(el => el && !isApiError(el)) as string[]
        );
    } catch (ex) {
        await unsetQueriedMoreArticlesByTag(tag);
        throw ex;
    }
}

/**
 * Returns articles that have the tag that is specified, querying them from the
 * various sources if needed (and adding to the cache and database)
 */
export async function getArticleIdsByTag(tag: string): Promise<Set<string>> {
    const cachedArticleIds = await getCachedArticleIdsByTag(tag);

    if (cachedArticleIds.length > 10) return new Set(cachedArticleIds);

    const databaseArticleIds = await getDatabaseArticleIdsByTag(tag);
    if (
        cachedArticleIds.length + databaseArticleIds.size > 10 ||
        !(await shouldQueryMoreArticlesByTag(tag))
    )
        return new Set([...cachedArticleIds, ...databaseArticleIds]);

    const calculatedArticleIds = await queryMoreArticlesByTag(tag);

    return new Set([
        ...calculatedArticleIds.flat(),
        ...cachedArticleIds,
        ...databaseArticleIds
    ]);
}
