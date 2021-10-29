import ApiError from "../../../api-types/ApiError";
import Article from "../../../api-types/Article";
import {searchers} from "../index";
import Searcher from "./Searcher";

type SearchersValue = typeof searchers;
type SearchersKey = keyof SearchersValue;
type RealSearcher<Id extends SearchersKey> = SearchersValue[Id];

export type RealSearchers = SearchersValue[SearchersKey];

export type RealSearcherContext = {
    [Id in RealSearchers["id"]]: {
        /**
         * The `id` of the searcher that the article is from
         */
        id: Id;

        /**
         * The `sourceArticleId` from the searcher
         */
        sourceArticleId: RealSearcher<Id> extends Searcher<
            Id,
            infer SourceArticleId
        >
            ? SourceArticleId
            : never;
    };
}[RealSearchers["id"]];

export default interface Loader<Id extends string, SourceArticleId> {
    readonly id: Id;

    /**
     * Returns an Article object for each of the source article IDs, returned
     * from `getSourceIdsBy*`
     * @param sourceArticleIds The IDs to load
     * @param errors An output to specify any errors that caused an article to fail to load
     */
    loadArticlesBySourceArticleIds(
        sourceArticleIds: SourceArticleId[],
        errors: Map<SourceArticleId, ApiError>
    ): Promise<
        ReadonlyMap<
            SourceArticleId,
            Omit<Article, "id" | "areExtraTagsLoading">
        >
    >;

    /**
     * Checks if this loader supports the source ID from one of the searchers.
     * If it does, it returns the sourceArticleId it can consume for the
     * article. Otherwise, if it doesn't, it returns `null`.
     */
    resolveLoaderArticleId(
        ctx: RealSearcherContext
    ): SourceArticleId | null | Promise<SourceArticleId | null>;

    /**
     * Converts the source article ID into a form that can be saved in Redis.
     * Must be able to be deserialised by `deserialiseSourceArticleId`.
     */
    serialiseSourceArticleId(sourceArticleId: SourceArticleId): string;

    /**
     * Converts the source article ID from its serialised form into the form
     * used by this loader
     */
    deserialiseSourceArticleId(sourceArticleId: string): SourceArticleId;
}
