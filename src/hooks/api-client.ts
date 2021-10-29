import {createContext, Endpoint, key} from "@alduino/api-utils";
import ApiError from "../api-types/ApiError";
import ImportRequest from "../api-types/ImportRequest";
import ImportResponse from "../api-types/ImportResponse";
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

export const importEndpoint: Endpoint<ImportRequest, ImportResponse | ApiError> = {
    apiContext,
    getKey({url}: ImportRequest): string {
        return key`import?${{url}}`;
    },
    fetch(url: string): Promise<ImportResponse | ApiError> {
        return fetch(url).then(res => res.json());
    }
};
