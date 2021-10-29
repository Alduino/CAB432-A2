import {ok as assert} from "assert";
import ApiError, {isApiError} from "../../api-types/ApiError";
import Article from "../../api-types/Article";
import {getCachedArticleIdBySourceIdOrLock} from "../../backend/redis";
import {loaders} from "../../backend/sources";
import Loader, {RealSearcherContext} from "../../backend/sources/types/Loader";
import createLogger from "../createLogger";
import {createArticle, getArticleIdBySourceId} from "../database";
import getMaybeCachedArticleById from "./getMaybeCachedArticleById";

const logger = createLogger("resolveArticleBySource");

async function loadArticleBySourceId(
    loader: Loader<string, unknown>,
    sourceId: string
): Promise<Article | ApiError | null> {
    const articleId = await getCachedArticleIdBySourceIdOrLock(
        loader.id,
        sourceId,
        async () => {
            const databaseId = await getArticleIdBySourceId(
                loader.id,
                sourceId
            );
            if (databaseId) return databaseId;

            const errorMap = new Map<unknown, ApiError>();

            const articlesBySourceId =
                await loader.loadArticlesBySourceArticleIds(
                    [sourceId],
                    errorMap
                );

            const basicArticleInfo = articlesBySourceId.get(sourceId);

            if (!basicArticleInfo) {
                // the loader couldn't grab this entry, we will have to ignore it
                return errorMap.get(sourceId) ?? null;
            }

            const articleId = await createArticle(
                loader.id,
                sourceId,
                basicArticleInfo
            );

            assert(
                articleId,
                `createArticle did not return an id for ${loader.id}:${sourceId}`
            );

            return articleId;
        }
    );

    if (articleId == null) {
        // the loader couldn't load the article
        return null;
    } else if (isApiError(articleId)) {
        return articleId;
    }

    const article = await getMaybeCachedArticleById(articleId);
    assert(
        article,
        `article ${articleId} (from ${loader.id}:${sourceId}) does not exist`
    );
    return article;
}

/**
 * Resolves an article by a source ID, using the first loader that can load that
 * source type
 * @returns The ID of the article, an ApiError if the loader gave one for this article, or null if no resolvers gave any errors
 */
export async function resolveArticleBySource(
    ctx: RealSearcherContext
): Promise<string | ApiError | null> {
    let lastApiError: ApiError | null;

    for (const loader of Object.values(loaders)) {
        lastApiError = null;

        const loaderId = await loader.resolveLoaderArticleId(ctx);
        if (!loaderId) continue;

        const serialiseSourceArticleId = loader.serialiseSourceArticleId(
            loaderId as never
        );

        const article = await loadArticleBySourceId(
            loader,
            serialiseSourceArticleId
        );

        if (article == null) continue;

        if (isApiError(article)) {
            lastApiError = article;
            continue;
        }

        return article.id;
    }

    logger.debug(
        "No loaders accepted a source for %s:%s",
        ctx.id,
        ctx.sourceArticleId
    );
    return lastApiError;
}
