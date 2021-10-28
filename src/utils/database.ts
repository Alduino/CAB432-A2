import {randomUUID} from "crypto";
import Article from "../api-types/Article";
import {ArtillerTable} from "../api-types/Schema";
import db from "../backend/db";
import DatabaseArticle from "../backend/db-types/DatabaseArticle";
import DatabaseArticleTag from "../backend/db-types/DatabaseArticleTag";
import {addCachedArticleIdsToTag, tagDiscoveryQueue} from "../backend/redis";

const articles = () => db<DatabaseArticle>(ArtillerTable.articles);
const articleTags = () => db<DatabaseArticleTag>(ArtillerTable.articleTags);

export async function getArticleById(id: string): Promise<Article | null> {
    const dbArticle = await articles().first("*").where({id});
    if (!dbArticle) return null;
    const tags = await articleTags()
        .select("name")
        .where({article_id: id})
        .then(res => res.map(tag => tag.name));

    return {
        id: dbArticle.id,
        title: dbArticle.title,
        author: dbArticle.author,
        link: dbArticle.link,
        published: dbArticle.published.toString(),
        paragraphs: dbArticle.paragraphs,
        tags
    };
}

export function getArticleIdsByMatchingWord(
    word: string
): Promise<Pick<DatabaseArticle, "id" | "title">[]> {
    // don't allow the user to break it
    word = word.replace(/%/g, "");
    return articles().select("id", "title").where("title", "like", `%${word}%`);
}

export async function getArticleIdsByTag(tag: string): Promise<Set<string>> {
    const columns = await articleTags().select("article_id").where("name", tag);
    return new Set(columns.map(col => col.article_id));
}

export async function getArticleIdsByAuthors(
    authors: string[]
): Promise<Set<string>> {
    const columns = await articles().select("id").whereIn("author", authors);
    return new Set(columns.map(col => col.id));
}

export async function getArticleIdsByDomains(
    domains: string[]
): Promise<Set<string>> {
    const columns = await articles()
        .select("id")
        .whereIn("link_domain", domains);
    return new Set(columns.map(col => col.id));
}

export async function getArticlesByIds(ids: string[]): Promise<Article[]> {
    const dbArticles = await articles().select("*").whereIn("id", ids);

    const tags = new Map(
        await Promise.all(
            ids.map(
                async id =>
                    [
                        id,
                        await articleTags()
                            .select("name")
                            .where("article_id", id)
                    ] as [string, Pick<DatabaseArticleTag, "name">[]]
            )
        )
    );

    return dbArticles.map(dbArticle => ({
        id: dbArticle.id,
        title: dbArticle.title,
        author: dbArticle.author,
        link: dbArticle.link,
        published: dbArticle.published.toString(),
        paragraphs: dbArticle.paragraphs,
        tags: tags.get(dbArticle.id).map(t => t.name)
    }));
}

export function getSourceIdString(sourceName: string, sourceId: string) {
    return `${sourceName}:${sourceId}`;
}

export async function getArticleIdBySourceId(
    sourceName: string,
    sourceId: string
): Promise<string | null> {
    const sourceIdString = getSourceIdString(sourceName, sourceId);
    const dbArticle = await articles()
        .first("id")
        .where("source_id", sourceIdString);
    return dbArticle?.id;
}

export async function createArticle(
    sourceName: string,
    sourceId: string,
    article: Omit<Article, "id">
): Promise<string> {
    const dbArticle: DatabaseArticle = {
        id: randomUUID(),
        source_id: getSourceIdString(sourceName, sourceId),
        title: article.title,
        author: article.author,
        link: article.link,
        link_domain: new URL(article.link).host,
        published: new Date(article.published),
        paragraphs: article.paragraphs
    };

    const dbTags: DatabaseArticleTag[] = article.tags.map(tag => ({
        id: randomUUID(),
        article_id: dbArticle.id,
        name: tag
    }));

    await articles().insert(dbArticle);
    await articleTags().insert(dbTags);

    await Promise.all(
        article.tags.map(tag => addCachedArticleIdsToTag(tag, [dbArticle.id]))
    );

    if (article.tags.length <= 3) {
        await tagDiscoveryQueue.queue(dbArticle.id);
    }

    return dbArticle.id;
}

export function getArticleCount(): Promise<number> {
    return articles()
        .count("id", {as: "count"})
        .then(res => parseInt(res[0].count as string));
}

export function getTagCount(): Promise<number> {
    return articleTags()
        .countDistinct("name", {as: "count"})
        .then(res => parseInt(res[0].count as string));
}

export function getAuthorCount(): Promise<number> {
    return articles()
        .countDistinct("author", {as: "count"})
        .then(res => parseInt(res[0].count as string));
}
