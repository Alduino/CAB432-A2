export default interface StatsResponse {
    /**
     * The number of articles that Artiller has data about
     */
    articles: number;

    /**
     * The number of tags that Artiller has indexed
     */
    tags: number;

    /**
     * The number of authors that Artiller has articles from
     */
    authors: number;

    /**
     * The size of the tag search queue
     */
    tagSearchQueueSize: number;

    /**
     * The size of the tag discovery queue
     */
    tagDiscoveryQueueSize: number;
}
