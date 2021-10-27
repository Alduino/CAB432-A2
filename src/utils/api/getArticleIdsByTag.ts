import {ok as assert} from "assert";
import Article from "../../api-types/Article";
import {
    getCachedArticleIdBySourceIdOrLock,
    getCachedArticleIdsByTag,
    setQueriedMoreArticles,
    shouldQueryMoreArticles
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

            const articleId = await createArticle(source.id, sourceId, basicArticleInfo);
            assert(articleId, `createArticle did not return an id for ${source.id}:${sourceId}`);
            return articleId;
        }
    );

    const article = await getMaybeCachedArticleById(articleId);
    assert(article, `article ${articleId} (from ${source.id}:${sourceId}) does not exist`);
    return article;
}

/**
 * Returns articles that have the tag that is specified, querying them from the
 * various sources if needed (and adding to the cache and database)
 */
export async function getArticleIdsByTag(tag: string): Promise<Set<string>> {
    const cachedArticleIds = await getCachedArticleIdsByTag(tag);

    if (!(await shouldQueryMoreArticles(tag))) return new Set(cachedArticleIds);

    const calculatedArticleIds = await Promise.all(
        Object.values(sources).map(async source => {
            const sourceIds = await source.getSourceIdsByTag(tag);
            return await Promise.all(
                sourceIds.map(id =>
                    loadArticleBySourceId(source, id).then(res => res.id)
                )
            );
        })
    );

    await setQueriedMoreArticles(tag);

    return new Set([...calculatedArticleIds.flat(), ...cachedArticleIds]);
}
