import {createContext, Endpoint, key} from "@alduino/api-utils";
import SearchRequest from "../api-types/SearchRequest";
import {SearchResponse} from "../api-types/SearchResponse";

const apiContext = createContext();
export const ApiProvider = apiContext.Provider.bind(apiContext);

export const searchEndpoint: Endpoint<SearchRequest, SearchResponse> = {
    apiContext,
    getKey({term, tags: tagsArray}: SearchRequest): string {
        const tags = tagsArray.map(item => `${item.kind}_${item.value}`).join(",");
        return key`search?${{term, tags}}`;
    },
    fetch(url: string): Promise<SearchResponse> {
        return fetch(url).then(res => res.json());
    }
};
