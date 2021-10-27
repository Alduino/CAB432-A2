export enum ArtillerTable {
    /**
     * Stores the base information about each article
     */
    articles = "articles",

    /**
     * Stores the tags that each article has
     */
    articleTags = "article_tags",

    /**
     * A queue of articles to discover tags for, as this needs to be done in
     * bulk to save costs.
     */
    parseQueue = "parse_queue"
}
