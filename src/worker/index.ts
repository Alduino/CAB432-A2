import {beginTagSearch} from "./tag-search";

const tagSearchWorkerCountSource = process.env.TAG_SEARCH_WORKER_COUNT;
const tagSearchWorkerCount = tagSearchWorkerCountSource ? parseInt(tagSearchWorkerCountSource) : 4;

beginTagSearch(tagSearchWorkerCount);
