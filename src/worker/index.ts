import {beginTagSearch} from "./tag-search";
import {beginWordSearch} from "./word-search";

const tagSearchWorkerCountSource = process.env.TAG_SEARCH_WORKER_COUNT;
const tagSearchWorkerCount = tagSearchWorkerCountSource ? parseInt(tagSearchWorkerCountSource) : 4;

const wordSearchWorkerCountSource = process.env.WORD_SEARCH_WORKER_COUNT;
const wordSearchWorkerCount = wordSearchWorkerCountSource ? parseInt(wordSearchWorkerCountSource) : 4;

beginTagSearch(tagSearchWorkerCount);
beginWordSearch(wordSearchWorkerCount);
