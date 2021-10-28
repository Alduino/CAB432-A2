import {ok as assert} from "assert";
import {NextApiRequest, NextApiResponse} from "next";
import SearchRequest from "../api-types/SearchRequest";
import {SearchResponse} from "../api-types/SearchResponse";
import {SearchMatch} from "../utils/api/SearchMatch";
import {getArticleIdsByTag} from "../utils/api/getArticleIdsByTag";
import getMatchableWords from "../utils/api/getMatchableWords";
import {getMaybeCachedArticlesByIds} from "../utils/api/getMaybeCachedArticleById";
import {getSearchFromQuery} from "../utils/api/getSearchFromQuery";
import {getSearchResponse} from "../utils/api/getSearchResponse";
import {
    getArticleIdsByAuthors,
    getArticleIdsByDomains,
    getArticleIdsByMatchingWord
} from "../utils/database";
import {workerTagSearchQueue} from "./redis";

async function matchArticlesBySearch(search: SearchRequest) {
    // maps the id of each article to the matches it has
    const articleMatches = new Map<string, SearchMatch[]>();

    function getArticleMatches(id: string) {
        const matches = articleMatches.get(id) ?? [];
        if (!articleMatches.has(id)) articleMatches.set(id, matches);
        return matches;
    }

    await Promise.all(
        getMatchableWords(search.term).map(async word => {
            const matchingArticles = await getArticleIdsByMatchingWord(word);

            for (const {id, title} of matchingArticles) {
                const index = title.toLowerCase().indexOf(word.toLowerCase());
                assert(index !== -1, "matching article title doesn't match");

                const matchArray = getArticleMatches(id);

                matchArray.push({
                    kind: "title",
                    from: index,
                    to: index + word.length
                });
            }
        })
    );

    const normalTags = search.tags
        .filter(tag => tag.kind === "normal")
        .map(tag => tag.value);

    await Promise.all(
        normalTags.map(async tag => {
            const articles = await getArticleIdsByTag(tag);

            for (const id of articles) {
                const matchArray = getArticleMatches(id);
                matchArray.push({kind: "tag", value: tag});
            }
        })
    );

    const authorTags = search.tags
        .filter(tag => tag.kind === "author")
        .map(tag => tag.value);
    const authorMatches = await getArticleIdsByAuthors(authorTags);

    const wwwTags = search.tags
        .filter(tag => tag.kind === "www")
        .map(tag => tag.value);
    const wwwMatches = await getArticleIdsByDomains(wwwTags);

    for (const id of authorMatches) {
        const matchArray = getArticleMatches(id);
        matchArray.push({kind: "author"});
    }

    for (const id of wwwMatches) {
        const matchArray = getArticleMatches(id);
        matchArray.push({kind: "www"});
    }

    const matchedArticles = await getMaybeCachedArticlesByIds(
        Array.from(articleMatches.keys())
    );
    const matchedArticlesMap = new Map(
        matchedArticles.map(art => [art.id, art])
    );

    await Promise.all(
        Array.from(
            new Set(matchedArticles.flatMap(article => article.tags))
        ).map(tag => workerTagSearchQueue.queue(tag))
    );

    return getSearchResponse(matchedArticlesMap, articleMatches);
}

export async function doSearch(req: NextApiRequest, res: NextApiResponse) {
    const search = await getSearchFromQuery(req.query);
    const matchedArticles = await matchArticlesBySearch(search);

    res.json({
        results: matchedArticles
    } as SearchResponse);
}
