import {hnSearcher} from "./hacker-news";
import {mediumLoader, mediumSearcher} from "./medium";
import scraperLoader from "./scraper";

export const searchers = {
    medium: mediumSearcher,
    hn: hnSearcher
};

export const loaders = {
    medium: mediumLoader,
    scraper: scraperLoader
};
