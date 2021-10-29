import {ok as assert} from "assert";
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
): Promise<Article | null> {
    const articleId = await getCachedArticleIdBySourceIdOrLock(
        loader.id,
        sourceId,
        async () => {
            const databaseId = await getArticleIdBySourceId(
                loader.id,
                sourceId
            );
            if (databaseId) return databaseId;

            const articlesBySourceId =
                await loader.loadArticlesBySourceArticleIds([sourceId]);

            const basicArticleInfo = articlesBySourceId.get(sourceId);

            if (!basicArticleInfo) {
                // the loader couldn't grab this entry, we will have to ignore it
                return null;
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
 */
export async function resolveArticleBySource(ctx: RealSearcherContext) {
    for (const loader of Object.values(loaders)) {
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

        return article.id;
    }

    logger.debug("No loaders accepted a source for %s:%s", ctx.id, ctx.sourceArticleId);
    return null;
}
