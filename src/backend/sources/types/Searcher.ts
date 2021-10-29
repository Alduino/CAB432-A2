export default interface Searcher<Id extends string, SourceArticleId> {
    readonly id: Id;

    /**
     * Returns a list of IDs for articles that have one of the tags. If the
     * source doesn't support searching by tag, don't implement this method.
     */
    getSourceIdsByTag?(tag: string): Promise<SourceArticleId[]>;

    /**
     * Returns a list of IDs for articles that match the specified word. If the
     * word does not have an exact match (after normalisation), that result will
     * be ignored.
     */
    getSourceIdsBySearch?(word: string): Promise<SourceArticleId[]>;
}
