import {ok as assert} from "assert";
import {NextApiRequest, NextApiResponse} from "next";
import SearchRequest from "../api-types/SearchRequest";
import {SearchResponse} from "../api-types/SearchResponse";
import {SearchMatch} from "../utils/api/SearchMatch";
import getArticleIdsBySearchWord from "../utils/api/getArticleIdsBySearchWord";
import {getArticleIdsByTag} from "../utils/api/getArticleIdsByTag";
import getMatchableWords from "../utils/api/getMatchableWords";
import {getMaybeCachedArticlesByIds} from "../utils/api/getMaybeCachedArticleById";
import {getSearchFromQuery} from "../utils/api/getSearchFromQuery";
import {getSearchResponse} from "../utils/api/getSearchResponse";
import {
    getArticleIdsByAuthors,
    getArticleIdsByDomains
} from "../utils/database";
import {workerTagSearchQueue, workerWordSearchQueue} from "./redis";

function getOrDefault<K, V>(id: K, map: Map<K, V>, def: V): V {
    const result = map.get(id) ?? def;
    if (!map.has(id)) map.set(id, result);
    return result;
}

async function matchArticlesBySearch(search: SearchRequest) {
    // maps the id of each article to the matches it has
    const articleMatches = new Map<string, SearchMatch[]>();

    // maps the id of each article to the list of words that may match
    const possibleTitleMatches = new Map<string, string[]>();

    await Promise.all(
        getMatchableWords(search.term).map(async word => {
            const possiblyMatchingArticleIds = await getArticleIdsBySearchWord(
                word
            );

            for (const id of possiblyMatchingArticleIds) {
                const matchArray = getOrDefault(id, possibleTitleMatches, []);
                matchArray.push(word);
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
                const matchArray = getOrDefault(id, articleMatches, []);
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
        const matchArray = getOrDefault(id, articleMatches, []);
        matchArray.push({kind: "author"});
    }

    for (const id of wwwMatches) {
        const matchArray = getOrDefault(id, articleMatches, []);
        matchArray.push({kind: "www"});
    }

    const matchedArticles = await getMaybeCachedArticlesByIds([
        ...articleMatches.keys(),
        ...possibleTitleMatches.keys()
    ]);

    const matchedArticlesMap = new Map(
        matchedArticles.map(article => [article.id, article])
    );

    await Promise.all(
        Array.from(possibleTitleMatches.entries()).map(
            async ([articleId, words]) => {
                const {id, title} = matchedArticlesMap.get(articleId);

                for (const word of words) {
                    const index = title
                        .toLowerCase()
                        .indexOf(word.toLowerCase());
                    if (index === -1) continue;

                    const matchArray = getOrDefault(id, articleMatches, []);

                    matchArray.push({
                        kind: "title",
                        from: index,
                        to: index + word.length
                    });
                }
            }
        )
    );

    await Promise.all(
        Array.from(
            new Set(matchedArticles.flatMap(article => article.tags))
        ).slice(0, 20).map(tag => workerTagSearchQueue.queue(tag))
    );

    await Promise.all(
        Array.from(
            new Set(matchedArticles.flatMap(article => getMatchableWords(article.title)))
        ).slice(0, 20).map(word => workerWordSearchQueue.queue(word))
    );

    return {
        topItems: getSearchResponse(matchedArticlesMap, articleMatches),
        resultsCount: articleMatches.size
    };
}

export async function doSearch(req: NextApiRequest, res: NextApiResponse) {
    const search = await getSearchFromQuery(req.query);
    const matchedArticles = await matchArticlesBySearch(search);

    res.json({
        results: matchedArticles.topItems,
        count: matchedArticles.resultsCount
    } as SearchResponse);
}
