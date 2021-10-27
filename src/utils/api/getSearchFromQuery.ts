import SearchRequest from "../../api-types/SearchRequest";
import {parseTag} from "../parseTag";

/**
 * Parses the search request out from the query object
 * @remarks No validation is done here. You must do it yourself if it is needed.
 * @example
 * getSearchFromQuery({})
 * // returns
 * {term: "", tags: []}
 * @example
 * getSearchFromQuery({term: "my search", tags: "normal_tag"})
 * // returns
 * {term: "my search", tags: [{kind: "normal", value: "tag"}]}
 */
export function getSearchFromQuery(
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
