import fetch from "node-fetch";
import {getCachedWebsiteContent, setCachedWebsiteContent} from "../../backend/redis";
import createLogger from "../createLogger";

const logger = createLogger("fetchMaybeCachedWebsite");

export default async function fetchMaybeCachedWebsite(url: string) {
    const cachedResult = await getCachedWebsiteContent(url);
    if (cachedResult) return cachedResult;

    let downloadedResult: string;

    try {
        downloadedResult = await fetch(url).then(res => res.text());
    } catch (err) {
        logger.warn(err, "Failed to fetch from %s", url);
        return null;
    }

    await setCachedWebsiteContent(url, downloadedResult);
    return downloadedResult;
}
