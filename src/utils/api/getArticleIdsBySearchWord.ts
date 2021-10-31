import {isApiError} from "../../api-types/ApiError";
import {
    addCachedArticleIdsToSearchWord,
    getCachedArticleIdsBySearchWord,
    setQueriedMoreArticlesBySearchWord,
    shouldQueryMoreArticlesBySearchWord,
    unsetQueriedMoreArticlesBySearchWord
} from "../../backend/redis";
import {getArticleIdsByMatchingWord} from "../database";
import {querySearchers} from "./querySearchers";
import {resolveArticleBySource} from "./resolveArticleBySource";

/**
 * Returns articles that match the search word that is specified, querying them
 * from the various sources if needed (and adding to the cache and database)
 */
export async function queryMoreArticlesBySearchWord(word: string): Promise<string[]> {
    await setQueriedMoreArticlesBySearchWord(word);

    try {
        const sourceIds = await querySearchers(searcher =>
            searcher.getSourceIdsBySearch?.(word)
        );

        return await Promise.all(sourceIds.map(resolveArticleBySource)).then(
            res => res.filter(el => el && !isApiError(el)) as string[]
        );
    } catch (ex) {
        await unsetQueriedMoreArticlesBySearchWord(word);
        throw ex;
    }
}

export default async function getArticleIdsBySearchWord(word: string) {
    const cachedArticleIds = await getCachedArticleIdsBySearchWord(word);

    if (cachedArticleIds.length > 10) return new Set(cachedArticleIds);

    const databaseArticleIds = await getArticleIdsByMatchingWord(word);

    if (
        cachedArticleIds.length + databaseArticleIds.size > 10 ||
        !(await shouldQueryMoreArticlesBySearchWord(word))
    ) {
        await addCachedArticleIdsToSearchWord(word, Array.from(databaseArticleIds));
        return new Set([...cachedArticleIds, ...databaseArticleIds]);
    }

    const calculatedArticleIds = await queryMoreArticlesBySearchWord(word);

    await addCachedArticleIdsToSearchWord(word, [
        ...calculatedArticleIds,
        ...databaseArticleIds
    ]);

    return new Set([
        ...calculatedArticleIds,
        ...cachedArticleIds,
        ...databaseArticleIds
    ]);
}
