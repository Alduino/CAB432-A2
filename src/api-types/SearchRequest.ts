export interface SearchRequestTag {
    /**
     * The type of tag this is. A `normal` tag maps to the `tags` in an article.
     * Other kinds may map to other values - `author` maps to each article's
     * author, `www` maps to its link, etc.
     */
    kind: "normal" | "author" | "www";

    /**
     * The actual value of this tag, to be mapped
     */
    value: string;
}

export default interface SearchRequest {
    tags: SearchRequestTag[];
    term: string;
}
