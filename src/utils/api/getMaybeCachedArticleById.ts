import Article from "../../api-types/Article";
import {getCachedArticleById, setCachedArticleById} from "../../backend/redis";
import {getArticleById, getArticlesByIds} from "../database";

export default async function getMaybeCachedArticleById(
    articleId: string
): Promise<Article | null> {
    const cached = await getCachedArticleById(articleId);
    if (cached) return cached;

    const fromDatabase = await getArticleById(articleId);
    if (fromDatabase) await setCachedArticleById(fromDatabase);

    return fromDatabase;
}

export async function getMaybeCachedArticlesByIds(articleIds: string[]): Promise<Article[]> {
    const result = new Map<string, Article>();
    const uncachedIds = new Set<string>(articleIds);

    await Promise.all(articleIds.map(async id => {
        const cached = await getCachedArticleById(id);
        if (!cached) return;
        result.set(id, cached);
        uncachedIds.delete(id);
    }));

    const fromDatabase = await getArticlesByIds(Array.from(uncachedIds));
    await Promise.all(
        fromDatabase.map(article => {

            result.set(article.id, article);
            return setCachedArticleById(article);
        })
    );

    return Array.from(result.values());
}
