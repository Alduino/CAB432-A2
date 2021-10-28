import {ok as assert} from "assert";
import Article from "../../api-types/Article";
import {
    getCachedArticleIdBySourceIdOrLock,
    getCachedArticleIdsByTag, setQueriedMoreArticles,
    shouldQueryMoreArticles, unsetQueriedMoreArticles
} from "../../backend/redis";
import {sources} from "../../backend/sources";
import Source from "../../backend/sources/Source";
import {createArticle, getArticleIdBySourceId} from "../database";
import getMaybeCachedArticleById from "./getMaybeCachedArticleById";

async function loadArticleBySourceId(
    source: Source<string, unknown>,
    sourceId: string
): Promise<Article> {
    const articleId = await getCachedArticleIdBySourceIdOrLock(
        source.id,
        sourceId,
        async () => {
            const databaseId = await getArticleIdBySourceId(
                source.id,
                sourceId
            );
            if (databaseId) return databaseId;

            const basicArticleInfo = await source
                .loadArticlesBySourceArticleIds([sourceId])
                .then(res => res.get(sourceId));

            const articleId = await createArticle(
                source.id,
                sourceId,
                basicArticleInfo
            );
            assert(
                articleId,
                `createArticle did not return an id for ${source.id}:${sourceId}`
            );
            return articleId;
        }
    );

    const article = await getMaybeCachedArticleById(articleId);
    assert(
        article,
        `article ${articleId} (from ${source.id}:${sourceId}) does not exist`
    );
    return article;
}

/**
 * Queries every source to find new articles with the specified tag. You should
 * first check if this actually needs to run, with `shouldQueryMoreArticles`.
 * @returns The IDs of the articles that were discovered
 */
export async function queryMoreArticles(tag: string): Promise<string[]> {
    await setQueriedMoreArticles(tag);

    try {
        return await Promise.all(
            Object.values(sources).map(async source => {
                const sourceIds = await source.getSourceIdsByTag(tag);
                return await Promise.all(
                    sourceIds.map(id =>
                        loadArticleBySourceId(source, id).then(res => res.id)
                    )
                );
            })
        ).then(res => res.flat());
    } catch (ex) {
        await unsetQueriedMoreArticles(tag);
        throw ex;
    }
}

/**
 * Returns articles that have the tag that is specified, querying them from the
 * various sources if needed (and adding to the cache and database)
 */
export async function getArticleIdsByTag(tag: string): Promise<Set<string>> {
    const cachedArticleIds = await getCachedArticleIdsByTag(tag);

    if (!(await shouldQueryMoreArticles(tag))) return new Set(cachedArticleIds);

    const calculatedArticleIds = await queryMoreArticles(tag);

    return new Set([...calculatedArticleIds.flat(), ...cachedArticleIds]);
}
