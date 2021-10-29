import StatsResponse from "../api-types/StatsResponse";
import {
    getMaybeCachedArticleCountStat,
    getMaybeCachedAuthorCountStat,
    getMaybeCachedTagCountStat
} from "../utils/api/maybe-cached-stats";
import {tagDiscoveryQueue, workerTagSearchQueue, workerWordSearchQueue} from "./redis";

export default async function getStats(): Promise<StatsResponse> {
    return {
        articles: await getMaybeCachedArticleCountStat(),
        tags: await getMaybeCachedTagCountStat(),
        authors: await getMaybeCachedAuthorCountStat(),
        tagSearchQueueSize: await workerTagSearchQueue.getSize(),
        wordSearchQueueSize: await workerWordSearchQueue.getSize(),
        tagDiscoveryQueueSize: await tagDiscoveryQueue.getSize()
    };
}
