import {SearchTag} from "../api-types/SearchTag";

export function parseTag(tag: string): SearchTag {
    const splitPoint = tag.indexOf("_");
    const kind =
        splitPoint === -1
            ? "normal"
            : (tag.substring(0, splitPoint) as SearchTag["kind"]);
    const value = splitPoint === -1 ? tag : tag.substring(splitPoint + 1);

    return {
        kind,
        value
    };
}
