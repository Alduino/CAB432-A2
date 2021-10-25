import {NextApiRequest, NextApiResponse} from "next";
import ApiError, {isApiError} from "../api-types/ApiError";
import Article from "../api-types/Article";
import SearchRequest from "../api-types/SearchRequest";
import {
    SearchResponse,
    SearchResponseItem,
    SearchResponseTag
} from "../api-types/SearchResponse";
import cut, {mergeCutRanges} from "./cut";
import {parseTag} from "./parseTag";

const articles: Article[] = [
    {
        id: "0",
        title: "Did Apple just ruin an almost perfect new MacBook design?",
        link: "https://appletips.com/did-apple-just-ruin",
        tags: ["apple", "macbook", "macbook-pro"],
        author: "Michael Myers",
        published: new Date().toString(),
        paragraphs: [
            "Lorem ipsum dolor sit amet. Actually, no. That will make this file look very ugly.",
            "But I need to test multiple paragraphs so here's another one."
        ]
    },
    {
        id: "1",
        title: "'Chris-tastic' news as Hemsworth sends his love to Cowra and accepts invitation",
        link: "https://the-hemsworths.com/christastic-cowra-invitation",
        tags: ["hemsworth", "cowra", "invitation"],
        author: "Liam Hemsworth",
        published: new Date().toString(),
        paragraphs: [
            "Lorem ipsum dolor sit amet. Actually, no. That will make this file look very ugly.",
            "But I need to test multiple paragraphs so here's another one."
        ]
    },
    {
        id: "2",
        title: "iPhone 13 upgrades suck - why you should wait for the iPhone 14",
        link: "https://appletips.com/wait-for-the-iphone-14",
        tags: ["apple", "iphone", "iphone13", "iphone14"],
        author: "Tim Apple",
        published: new Date().toString(),
        paragraphs: [
            "Lorem ipsum dolor sit amet. Actually, no. That will make this file look very ugly.",
            "But I need to test multiple paragraphs so here's another one."
        ]
    }
];

interface SearchMatch_Range {
    kind: "title";
    from: number;
    to: number;
}

interface SearchMatch_Indexed {
    kind: "tag";
    index: number;
}

interface SearchMatch_Single {
    kind: "www" | "author";
}

type SearchMatch = SearchMatch_Range | SearchMatch_Indexed | SearchMatch_Single;

function getSearchFromQuery(
    query: Record<string, string | string[]>
): SearchRequest {
    const term = Array.isArray(query.term)
        ? query.term.join(" ")
        : query.term ?? "";

    const tags = (Array.isArray(query.tags) ? query.tags : [query.tags ?? ""])
        .flatMap(tagList => tagList.split(","))
        .map(parseTag);

    return {term, tags};
}

export function mockSearch(req: NextApiRequest, res: NextApiResponse) {
    const search: SearchRequest = getSearchFromQuery(req.query);

    /**
     * Maps the index of the article to an array of matches
     */
    const resultArticles = new Map<number, SearchMatch[]>();

    for (const wordUntrimmed of search.term.split(/\s+/g)) {
        const word = wordUntrimmed.trim().replace(/[^a-z0-9]/gi, "");
        if (!word) continue;

        const wordNormalised = word.toLowerCase();

        articles.forEach((article, i) => {
            const titleNormalised = article.title.toLowerCase();
            const matchIndex = titleNormalised.indexOf(wordNormalised);
            if (matchIndex === -1) return;

            const matchArray = resultArticles.get(i) ?? [];
            matchArray.push({
                kind: "title",
                from: matchIndex,
                to: matchIndex + word.length
            });

            if (!resultArticles.has(i)) resultArticles.set(i, matchArray);
        });
    }

    for (const tag of search.tags) {
        articles.forEach((article, i) => {
            const matchArray = resultArticles.get(i) ?? [];
            let matched = false;

            switch (tag.kind) {
                case "normal": {
                    const tagIndex = article.tags.indexOf(tag.value);
                    if (tagIndex === -1) break;
                    matched = true;
                    matchArray.push({kind: "tag", index: tagIndex});
                    break;
                }
                case "author":
                    if (
                        article.author.toLowerCase() !== tag.value.toLowerCase()
                    )
                        break;
                    matched = true;
                    matchArray.push({kind: "author"});
                    break;
                case "www": {
                    const articleHost = new URL(article.link).host;
                    if (articleHost !== tag.value.toLowerCase()) break;
                    matched = true;
                    matchArray.push({kind: "www"});
                    break;
                }
            }

            if (matched && !resultArticles.has(i)) {
                resultArticles.set(i, matchArray);
            }
        });
    }

    const matchedArticles: SearchResponseItem[] = Array.from(
        resultArticles.entries()
    )
        .sort((a, b) => b[1].length - a[1].length)
        .map(([idx, matches]) => {
            const article = articles[idx];

            const titleCutPoints = mergeCutRanges(
                (
                    matches.filter(
                        match => match.kind === "title"
                    ) as SearchMatch_Range[]
                ).map(match => [match.from, match.to])
            ).flat();

            const tagMatches = new Set(
                (
                    matches.filter(
                        match => match.kind === "tag"
                    ) as SearchMatch_Indexed[]
                ).map(match => match.index)
            );

            const tags: SearchResponseTag[] = article.tags.map((tag, i) => ({
                name: tag,
                wasMatched: tagMatches.has(i)
            }));

            return {
                id: article.id,
                title: cut(article.title, titleCutPoints),
                link: article.link,
                wasLinkMatch: matches.some(it => it.kind === "www"),
                author: article.author,
                wasAuthorMatch: matches.some(it => it.kind === "author"),
                published: article.published,
                tags
            };
        });

    res.json({
        results: matchedArticles
    } as SearchResponse);
}

export function getArticleResult(
    query: Record<string, string | string[]>
): Article | ApiError {
    if (!query.id) {
        return {
            error: "MISSING_PARAM",
            param: "query.id"
        };
    }

    const id = parseInt(query.id as string);

    if (Number.isNaN(id)) {
        return {
            error: "INVALID_PARAM",
            param: "query.id"
        };
    }

    if (id < 0 || id >= articles.length) {
        return {
            error: "NOT_FOUND"
        };
    }

    return articles[id];
}

export function mockArticle(req: NextApiRequest, res: NextApiResponse) {
    const result = getArticleResult(req.query);

    if (isApiError(result)) {
        res.status(result.error === "NOT_FOUND" ? 404 : 400);
    }

    res.json(result);
}
