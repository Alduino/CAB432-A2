import {hnSearcher} from "./hacker-news";
import {mediumLoader, mediumSearcher} from "./medium";
import scraperLoader, {scraperSearcher} from "./scraper";

export const searchers = {
    medium: mediumSearcher,
    hn: hnSearcher,
    scraper: scraperSearcher
};

export const loaders = {
    medium: mediumLoader,
    scraper: scraperLoader
};
