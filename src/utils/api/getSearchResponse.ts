import Article from "../../api-types/Article";
import {
    SearchResponseItem,
    SearchResponseTag
} from "../../api-types/SearchResponse";
import cut, {mergeCutRanges} from "../cut";
import {
    SearchMatch,
    SearchMatch_Range,
    SearchMatch_Valued
} from "./SearchMatch";

/**
 * Gets the search response based on each article's matches
 * @param articles Mapping of the articles used in `matches` to their IDs
 * @param matches Mapping of each article's ID to its search matches
 */
export function getSearchResponse<Id>(
    articles: Map<Id, Article>,
    matches: Map<Id, SearchMatch[]>
) {
    const matchedArticles: SearchResponseItem[] = Array.from(matches.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .map(([id, matches]) => {
            const article = articles.get(id);

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
                    ) as SearchMatch_Valued[]
                ).map(match => match.value)
            );

            const tags: SearchResponseTag[] = article.tags.map(tag => ({
                name: tag,
                wasMatched: tagMatches.has(tag)
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
    return matchedArticles;
}
