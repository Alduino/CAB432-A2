export interface SearchMatch_Range {
    kind: "title";
    from: number;
    to: number;
}

export interface SearchMatch_Valued {
    kind: "tag";
    value: string;
}

export interface SearchMatch_Single {
    kind: "www" | "author";
}

export type SearchMatch =
    | SearchMatch_Range
    | SearchMatch_Valued
    | SearchMatch_Single;
