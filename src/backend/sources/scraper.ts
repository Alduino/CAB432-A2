import {ok as assert} from "assert";
import {CheerioAPI, load} from "cheerio";
import {parse as parseJson5} from "json5";
import ApiError from "../../api-types/ApiError";
import Article from "../../api-types/Article";
import fetchMaybeCachedWebsite from "../../utils/api/fetchMaybeCachedWebsite";
import createLogger from "../../utils/createLogger";
import normaliseTag from "../../utils/normaliseTag";
import Loader, {RealSearcherContext} from "./types/Loader";
import Searcher from "./types/Searcher";

const logger = createLogger("source:scraper");

interface ScraperReducer {
    (
        $: CheerioAPI,
        previous: Omit<Article, "id" | "areExtraTagsLoading">
    ): Omit<
        Omit<Article, "id" | "areExtraTagsLoading">,
        "id" | "areExtraTagsLoading"
    >;
}

const scraperLoaders: ScraperReducer[] = [
    function openGraphTitle($, prev) {
        if (prev.title) return prev;
        const title = $("meta[property=og\\:title]")?.attr("content")?.trim();
        return {...prev, title, _titleSource: "opengraph_title"};
    },
    function metaTitle($, prev) {
        if (prev.title) return prev;
        const title = $("meta[name=title]")?.attr("content")?.trim();
        return {...prev, title, _titleSource: "meta_title"};
    },
    function twitterTitle($, prev) {
        if (prev.title) return prev;
        const title = $("meta[name=twitter\\:title]")?.attr("content")?.trim();
        return {...prev, title, _titleSource: "twitter_title"};
    },
    function openGraphUpdated($, prev) {
        if (prev.published) return prev;
        const published = $("meta[property=og\\:updated_time]")
            ?.attr("content")
            ?.trim();
        if (Number.isNaN(Date.parse(published))) return prev;
        return {...prev, published, _publishedSource: "opengraph_updated"};
    },
    function articleModified($, prev) {
        if (prev.published) return prev;
        const published = $("meta[property=article\\:modified_time]")
            ?.attr("content")
            ?.trim();
        if (Number.isNaN(Date.parse(published))) return prev;
        return {...prev, published, _publishedSource: "article_modified"};
    },
    function articlePublished($, prev) {
        if (prev.published) return prev;
        const published = $("meta[property=article\\:published_time]")
            ?.attr("content")
            ?.trim();
        if (Number.isNaN(Date.parse(published))) return prev;
        return {...prev, published, _publishedSource: "article_published"};
    },
    function metaArticleTags($, prev) {
        const tags = $("meta[property=article\\:tag]")
            .toArray()
            .map(el => $(el).attr("content")?.trim())
            .filter(Boolean)
            .map(normaliseTag)
            .filter(Boolean);
        return {
            ...prev,
            tags: [...prev.tags, ...tags],
            _tagsSource: [
                ...((prev as any)._tagsSource ?? []),
                "meta_article_tags"
            ]
        };
    },
    function metaKeywords($, prev) {
        const tags = $("meta[name=keywords]")
            .first()
            ?.attr("content")
            ?.split(",")
            .map(normaliseTag);

        if (!tags) return prev;
        return {
            ...prev,
            tags: [...prev.tags, ...tags],
            _tagsSource: [...((prev as any)._tagsSource ?? []), "meta_keywords"]
        };
    },
    function ldData($, prev) {
        const ldDataTxt = $("script[type=application\\/ld\\+json]")?.html();
        if (!ldDataTxt) return prev;

        let ldData: Record<string, any>;
        try {
            ldData = parseJson5(ldDataTxt);
        } catch {
            logger.warn("Failed to parse JSON from LD Data (%s)", ldDataTxt);
            return prev;
        }

        return gatherData($, prev, [
            ($, prev) => {
                if (prev.title) return prev;
                if (typeof ldData.headline !== "string") return prev;

                const title = ldData.headline.trim();
                if (!title) return prev;
                return {...prev, title, _titleSource: "ld_data"};
            },
            ($, prev) => {
                if (prev.published) return prev;
                if (typeof ldData.dateModified !== "string") return prev;
                if (Number.isNaN(Date.parse(ldData.dateModified))) return prev;
                return {
                    ...prev,
                    published: ldData.dateModified,
                    _publishedSource: "ld_data:modified"
                };
            },
            ($, prev) => {
                if (prev.published) return prev;
                if (typeof ldData.dateModified !== "string") return prev;
                if (Number.isNaN(Date.parse(ldData.datePublished))) return prev;
                return {
                    ...prev,
                    published: ldData.datePublished,
                    _publishedSource: "ld_data:published"
                };
            },
            ($, prev) => {
                if (Array.isArray(ldData.keywords)) {
                    ldData.keywords = ldData.keywords.join(",");
                }

                if (typeof ldData.keywords !== "string") return prev;
                const tags = ldData.keywords.split(",").map(normaliseTag);
                return {
                    ...prev,
                    tags: [...prev.tags, ...tags],
                    _tagsSource: [
                        ...((prev as any)._tagsSource ?? []),
                        "ld_data"
                    ]
                };
            },
            ($, prev) => {
                if (prev.author) return prev;
                if (typeof ldData.author === "string")
                    ldData.author = {name: ldData.author};
                if (typeof ldData.author?.name !== "string") return prev;

                const author = ldData.author.name.trim();
                if (!author) return prev;
                return {...prev, author, _authorSource: "ld_Data"};
            }
        ]);
    },
    function dcTermsCreator($, prev) {
        if (prev.author) return prev;
        const author = $("meta[name=dcterms\\.creator]")
            ?.attr("content")
            ?.trim();
        if (!author) return prev;
        return {...prev, author, _authorSource: "dcterms_creator"};
    },
    function metaAuthor($, prev) {
        if (prev.author) return prev;
        const author = $("meta[name=author]")?.attr("content")?.trim();
        if (!author) return prev;
        return {...prev, author, _authorSource: "meta_author"};
    },
    function twitterCreator($, prev) {
        if (prev.author) return prev;
        const author = $("meta[name=twitter\\:creator]")
            ?.attr("content")
            ?.trim();
        if (!author) return prev;
        return {...prev, author, _authorSource: "twitter_creator"};
    },
    function bodyArticleParagraphs($, prev) {
        if (prev.paragraphs.length > 0) return prev;
        const paragraphs = $("article p")
            .toArray()
            .map(p => $(p).text().trim())
            .filter(Boolean);
        return {
            ...prev,
            paragraphs,
            _paragraphsSource: "body_article_paragraphs"
        };
    },
    function bodyNonArticleParagraphs($, prev) {
        if (prev.paragraphs.length > 0) return prev;
        const paragraphs = $("p")
            .not("noscript p, header p, footer p, aside p, figure p")
            .toArray()
            .map(p => $(p).text().trim())
            .filter(Boolean);
        return {
            ...prev,
            paragraphs,
            _paragraphsSource: "body_not_article_paragraphs"
        };
    }
];

function gatherData(
    $: CheerioAPI,
    base: Omit<Article, "id" | "areExtraTagsLoading">,
    loaders: ScraperReducer[]
) {
    const res = loaders.reduce((prev, curr) => {
        const result = curr($, prev);
        assert(result, `Scraper reducer ${curr.name} did not return any value`);
        return result;
    }, base);

    // remove any duplicate tags
    res.tags = Array.from(new Set(res.tags));
    return res;
}

const scraperLoader: Loader<"scraper", URL> = {
    id: "scraper",
    async loadArticlesBySourceArticleIds(
        sourceArticleIds: URL[],
        errors: Map<URL, ApiError>
    ): Promise<ReadonlyMap<URL, Omit<Article, "id" | "areExtraTagsLoading">>> {
        const articles = await Promise.all(
            sourceArticleIds.map(async postId => {
                const result = await fetchMaybeCachedWebsite(postId.toString());

                if (!result) {
                    errors.set(postId, {
                        error: "CONNECTION_ERROR"
                    });
                    return null;
                }

                const $ = load(result);

                const baseArticle: Omit<Article, "id" | "areExtraTagsLoading"> =
                    {
                        title: "",
                        author: "",
                        link: postId.toString(),
                        tags: [],
                        published: "",
                        paragraphs: []
                    };

                const data = gatherData($, baseArticle, scraperLoaders);

                if (
                    !data.title ||
                    !data.author ||
                    !data.published ||
                    !data.paragraphs
                ) {
                    errors.set(postId, {
                        error: "MISSING_FIELD",
                        field: !data.title
                            ? "title"
                            : !data.author
                            ? "author"
                            : !data.published
                            ? "published"
                            : "paragraphs"
                    });

                    logger.trace(
                        {
                            ...data,
                            paragraphs: []
                        },
                        "Ignored article at %s because it didn't contain enough data",
                        postId.toString()
                    );
                    return null;
                }

                return [postId, data] as [
                    URL,
                    Omit<Article, "id" | "areExtraTagsLoading">
                ];
            })
        );

        return new Map(articles.filter(Boolean));
    },
    serialiseSourceArticleId(sourceArticleId: URL): string {
        return sourceArticleId.toString();
    },
    deserialiseSourceArticleId(sourceArticleId: string): URL {
        return new URL(sourceArticleId);
    },
    resolveLoaderArticleId(ctx: RealSearcherContext): URL | null {
        return ctx.sourceArticleId instanceof URL ? ctx.sourceArticleId : null;
    }
};

export default scraperLoader;

/**
 * Doesn't actually do anything, mainly used for custom searchers
 */
export const scraperSearcher: Searcher<"scraper", URL> = {
    id: "scraper"
};
