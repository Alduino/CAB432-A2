import fetch from "node-fetch";
import createLogger from "../../utils/createLogger";
import Searcher from "./types/Searcher";

const logger = createLogger("source:hacker-news");

interface HnAlgoliaSearchResult {
    hits: {
        url: string;
    }[];
}

export const hnSearcher: Searcher<"hn", URL> = {
    id: "hn",
    async getSourceIdsBySearch(word: string): Promise<URL[]> {
        const searchUrl = new URL("https://hn.algolia.com/api/v1/search");
        searchUrl.searchParams.set("query", word);

        logger.trace("Sending request to hn search to find %s", word);
        const {hits} = (await fetch(searchUrl.toString()).then(res =>
            res.json()
        )) as HnAlgoliaSearchResult;

        return hits
            .slice(0, 10)
            .map(hit => {
                try {
                    return new URL(hit.url);
                } catch {
                    return null;
                }
            })
            .filter(Boolean);
    }
};
