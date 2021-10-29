import {load} from "cheerio";
import fetch, {Headers} from "node-fetch";
import Article from "../../api-types/Article";
import fetchMaybeCachedWebsite from "../../utils/api/fetchMaybeCachedWebsite";
import createLogger from "../../utils/createLogger";
import Loader, {RealSearcherContext} from "./types/Loader";
import Searcher from "./types/Searcher";

const logger = createLogger("source:medium");

const articleUrlRegex = /^medium:\/\/p\/(?<id>[0-9a-f]+)$/;

async function fetchGraphQl<T = unknown>(
    query: string,
    variables: Record<string, unknown>
): Promise<T> {
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("User-Agent", "ArtillerBackend/0.1.0");

    logger.trace("Sending graphql request to Medium");
    const res = await fetch("https://medium.com/_/graphql", {
        method: "post",
        headers: headers,
        body: JSON.stringify({
            query,
            variables
        })
    });

    const text = await res.text();

    try {
        const res = JSON.parse(text);
        return res.data;
    } catch (err) {
        logger.error(
            "The response for the following error is:",
            text.substring(0, 100)
        );
        throw err;
    }
}

interface SourceIdByTagResult {
    tagFeed: {
        items: {
            post: {
                id: string;
            };
        }[];
    };
}

interface ArticleBySourceIdResult {
    post: {
        title: string;
        mediumUrl: string;
        updatedAt: number;
        creator: {
            name: string;
        };
        tags: {
            normalizedTagSlug: string;
        }[];
        viewerEdge: {
            fullContent: {
                bodyModel: {
                    paragraphs: {
                        type: string;
                        text: string;
                    }[];
                };
            };
        };
    };
}

export const mediumSearcher: Searcher<"medium", string> = {
    id: "medium",
    async getSourceIdsByTag(tag: string): Promise<string[]> {
        // language=graphql
        const query = `
            query TagFeedQuery($tagSlug: String, $mode: TagFeedMode) {
                tagFeed(paging: {limit: 10}, mode: $mode, tagSlug: $tagSlug) {
                    items {
                        ... on TagFeedItem {
                            post {
                                id
                            }
                        }
                    }
                }
            }
        `;

        return (
            (
                await fetchGraphQl<SourceIdByTagResult>(query, {
                    tagSlug: tag,
                    mode: "HOT"
                })
            ).tagFeed?.items.map(item => item.post.id) ?? []
        );
    }
};

export const mediumLoader: Loader<"medium", string> = {
    id: "medium",
    async loadArticlesBySourceArticleIds(
        sourceArticleIds: string[]
    ): Promise<
        ReadonlyMap<string, Omit<Article, "id" | "areExtraTagsLoading">>
    > {
        // language=graphql
        const query = `
            query PostViewerEdgeContent($postId: ID!) {
                post(id: $postId) {
                    title
                    mediumUrl
                    updatedAt
                    creator {
                        name
                    }
                    tags {
                        normalizedTagSlug
                    }
                    viewerEdge {
                        fullContent {
                            bodyModel {
                                paragraphs {
                                    type
                                    text
                                }
                            }
                        }
                    }
                }
            }
        `;

        return new Map(
            await Promise.all(
                sourceArticleIds.map(async postId => {
                    const {post: article} =
                        await fetchGraphQl<ArticleBySourceIdResult>(query, {
                            postId
                        });

                    const content =
                        article.viewerEdge.fullContent.bodyModel.paragraphs;

                    return [
                        postId,
                        {
                            title: article.title,
                            author: article.creator.name,
                            link: article.mediumUrl,
                            tags: article.tags.map(
                                tag => tag.normalizedTagSlug
                            ),
                            paragraphs: content
                                .filter(el => el.type === "P")
                                .map(el => el.text),
                            published: new Date(article.updatedAt).toString()
                        }
                    ] as [string, Omit<Article, "id" | "areExtraTagsLoading">];
                })
            )
        );
    },
    serialiseSourceArticleId(sourceArticleId: string): string {
        return sourceArticleId;
    },
    deserialiseSourceArticleId(sourceArticleId: string): string {
        return sourceArticleId;
    },
    async resolveLoaderArticleId(
        ctx: RealSearcherContext
    ): Promise<string | null> {
        const hostRegex = /\.?medium\.com$/;
        const idRegex = /-(?<id>[0-9a-f]+)$/;

        if (ctx.id === "medium") {
            return ctx.sourceArticleId;
        } else if (ctx.sourceArticleId instanceof URL) {
            if (hostRegex.test(ctx.sourceArticleId.host)) {
                return (
                    idRegex.exec(ctx.sourceArticleId.pathname)?.groups.id ??
                    null
                );
            } else {
                const result = await fetchMaybeCachedWebsite(
                    ctx.sourceArticleId.toString()
                );
                if (!result) return null;

                const $ = load(result);
                const siteName = $("meta[property=og\\:site_name]");
                if (!siteName) return null;
                if (siteName.attr("content")?.toUpperCase() !== "MEDIUM")
                    return null;

                const articleId = $(
                    "meta[property=al\\:android\\:url], meta[property=al\\:ios\\:url], meta[name=twitter\\:app\\:url\\:iphone]"
                );
                if (!articleId) return null;
                const articleIdValue = articleId.attr("content");
                if (!articleIdValue) return null;

                const articleIdMatch = articleUrlRegex.exec(articleIdValue);
                return articleIdMatch?.groups?.id ?? null;
            }
        } else {
            return null;
        }
    }
};
