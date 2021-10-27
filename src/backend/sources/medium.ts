import Article from "../../api-types/Article";
import Source from "./Source";

async function fetchGraphQl<T = unknown>(
    query: string,
    variables: Record<string, unknown>
): Promise<T> {
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("User-Agent", "ArtillerBackend/0.1.0");

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
        console.error("The response for the following error is:", text);
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

const mediumSource: Source<"medium", string> = {
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
            await fetchGraphQl<SourceIdByTagResult>(query, {
                tagSlug: tag,
                mode: "HOT"
            })
        ).tagFeed?.items.map(item => item.post.id) ?? [];
    },
    async loadArticlesBySourceArticleIds(
        sourceArticleIds: string[]
    ): Promise<ReadonlyMap<string, Omit<Article, "id">>> {
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
                    ] as [string, Omit<Article, "id">];
                })
            )
        );
    }
};

export default mediumSource;
