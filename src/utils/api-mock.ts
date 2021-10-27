import {NextApiRequest, NextApiResponse} from "next";
import ApiError, {isApiError} from "../api-types/ApiError";
import Article from "../api-types/Article";
import SearchRequest from "../api-types/SearchRequest";
import {SearchResponse} from "../api-types/SearchResponse";
import {SearchMatch} from "./api/SearchMatch";
import {getSearchFromQuery} from "./api/getSearchFromQuery";
import {getSearchResponse} from "./api/getSearchResponse";

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

function matchArticlesBySearch(search: SearchRequest) {
    /**
     * Maps the index of the article to an array of matches
     */
    const resultMatches = new Map<number, SearchMatch[]>();

    for (const wordUntrimmed of search.term.split(/\s+/g)) {
        const word = wordUntrimmed.trim().replace(/[^a-z0-9]/gi, "");
        if (!word) continue;

        const wordNormalised = word.toLowerCase();

        articles.forEach((article, i) => {
            const titleNormalised = article.title.toLowerCase();
            const matchIndex = titleNormalised.indexOf(wordNormalised);
            if (matchIndex === -1) return;

            const matchArray = resultMatches.get(i) ?? [];
            matchArray.push({
                kind: "title",
                from: matchIndex,
                to: matchIndex + word.length
            });

            if (!resultMatches.has(i)) resultMatches.set(i, matchArray);
        });
    }

    for (const tag of search.tags) {
        articles.forEach((article, i) => {
            const matchArray = resultMatches.get(i) ?? [];
            let matched = false;

            switch (tag.kind) {
                case "normal": {
                    if (!article.tags.includes(tag.value)) break;
                    matched = true;
                    matchArray.push({kind: "tag", value: tag.value});
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

            if (matched && !resultMatches.has(i)) {
                resultMatches.set(i, matchArray);
            }
        });
    }

    const resultArticles = new Map(articles.map((article, i) => [i, article]));

    return getSearchResponse(resultArticles, resultMatches);
}

export function mockSearch(req: NextApiRequest, res: NextApiResponse) {
    const search: SearchRequest = getSearchFromQuery(req.query);
    const matchedArticles = matchArticlesBySearch(search);

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
