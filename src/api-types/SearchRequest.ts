import {SearchTag} from "./SearchTag";

export default interface SearchRequest {
    tags: SearchTag[];
    term: string;
}
