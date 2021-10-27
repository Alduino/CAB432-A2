import Article from "../api-types/Article";
import {ArtillerTable} from "../api-types/Schema";
import db from "../backend/db";
import DatabaseArticle from "../backend/db-types/DatabaseArticle";
import DatabaseArticleTag from "../backend/db-types/DatabaseArticleTag";
import DatabaseParseQueueItem from "../backend/db-types/DatabaseParseQueueItem";

const articles = () => db<DatabaseArticle>(ArtillerTable.articles);
const articleTags = () => db<DatabaseArticleTag>(ArtillerTable.articleTags);
const parseQueue = () => db<DatabaseParseQueueItem>(ArtillerTable.parseQueue);

export async function getArticleById(id: string): Promise<Article | null> {
    const article = await articles().first("*").where({id});
    if (!article) return null;
    const tags = await articleTags()
        .select("name")
        .where({article_id: id})
        .then(res => res.map(tag => tag.name));

    return {
        ...article,
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
    const columns = await articles().select("id").whereIn("link_domain", domains);
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
                        await articleTags().select("name").where("article_id", id)
                    ] as [string, Pick<DatabaseArticleTag, "name">[]]
            )
        )
    );

    console.log(ids);

    return dbArticles.map(dbArticle => ({
        id: dbArticle.id,
        title: dbArticle.title,
        author: dbArticle.author,
        link: dbArticle.link,
        published: dbArticle.published,
        paragraphs: dbArticle.paragraphs,
        tags: tags.get(dbArticle.id).map(t => t.name)
    }));
}
