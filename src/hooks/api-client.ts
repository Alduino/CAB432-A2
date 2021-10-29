import {createContext, Endpoint, key} from "@alduino/api-utils";
import ApiError from "../api-types/ApiError";
import SearchRequest from "../api-types/SearchRequest";
import {SearchResponse} from "../api-types/SearchResponse";
import StatsResponse from "../api-types/StatsResponse";

const apiContext = createContext();
export const ApiProvider = apiContext.Provider.bind(apiContext);

export const searchEndpoint: Endpoint<SearchRequest, SearchResponse | ApiError> = {
    apiContext,
    getKey({term, tags: tagsArray}: SearchRequest): string {
        const tags = tagsArray.map(item => `${item.kind}_${item.value}`).join(",");
        return key`search?${{term, tags}}`;
    },
    fetch(url: string): Promise<SearchResponse> {
        return fetch(url).then(res => res.json());
    }
};

export const statsEndpoint: Endpoint<void, StatsResponse> = {
    apiContext,
    getKey(): string {
        return "stats";
    },
    fetch(url: string): Promise<StatsResponse> {
        return fetch(url).then(res => res.json());
    }
};
