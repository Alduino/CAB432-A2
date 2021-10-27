import Article from "../../api-types/Article";

export default interface Source<Name extends string, SourceArticleId> {
    readonly id: Name;

    /**
     * Returns a list of IDs for articles that have one of the tags
     */
    getSourceIdsByTag(tag: string): Promise<SourceArticleId[]>;

    /**
     * Returns an Article object for each of the source article IDs, returned
     * from `getSourceIdsBy*`.
     */
    loadArticlesBySourceArticleIds(
        sourceArticleIds: SourceArticleId[]
    ): Promise<ReadonlyMap<string, Omit<Article, "id">>>;
}
