import {searchers} from "../../backend/sources";
import {
    RealSearcherContext,
    RealSearchers
} from "../../backend/sources/types/Loader";
import createLogger from "../createLogger";

const logger = createLogger("querySearchers");

export function querySearchers(
    run: (searcher: RealSearchers) => Promise<unknown[]> | null
): Promise<RealSearcherContext[]> {
    return Promise.all(
        Object.values(searchers).map(searcher => {
            logger.debug("Querying searcher %s", searcher.id);
            const result = run(searcher);
            if (!result) return [];
            return result.then(res =>
                res.map(item => ({
                    id: searcher.id,
                    sourceArticleId: item
                }))
            );
        })
    ).then(res => res.flat());
}
