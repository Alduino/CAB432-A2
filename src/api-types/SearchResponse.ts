export interface SearchResponseTag {
    /**
     * The name of this tag, normalised to lowercase and dash separated
     */
    name: string;

    /**
     * Whether or not this tag was matched with the search
     */
    wasMatched: boolean;
}

export interface SearchResponseItem {
    /**
     * A unique reference to this article
     */
    id: string;

    /**
     * The title of the article, but split out so that even elements are matches
     * from the search (and will be highlighted on the client), e.g.
     *
     * - Search: `"[apple] macbook 2021"`
     * - Result: `["Did ", "Apple", " just ruin an almost perfect new ", "MacBook", " design?"]`
     * - "Apple" and "MacBook" will be highlighted on the client.
     */
    title: string[];

    /**
     * The name of the author
     */
    author: string;

    /**
     * True if this result is because the author matched, false if it wasn't
     *
     * For example,
     * - Search: `"[author: Michael Myers]"`
     * - Item's author: `"Michael Myers"`
     * Was author match? `true`
     *
     * Or,
     * - Search: `"[author: Michael Myers]"`
     * - Item's author: `"Jeff Bezos"`
     * Was author match? `false`
     */
    wasAuthorMatch: boolean;

    /**
     * The link to the article. Only the hostname will be displayed, but the
     * user can click it to open this page.
     */
    link: string;

    /**
     * True if this result is because the link's hostname matched, false if not
     *
     * For example,
     * - Search: `"[link: linustechtips.com]"`
     * - Item's link: `"https://www.linustechtips.com"`
     * Was link match? `true`
     *
     * Or,
     * - Search: `"[link: linustechtips.com]"`
     * - Item's link: `"https://www.bing.com"`
     * Was link match? `false`
     */
    wasLinkMatch: boolean;

    /**
     * The date that the article was published, as a ECMA-262 string
     */
    published: string;

    /**
     * The tags that this item has, and whether or not they matched
     */
    tags: SearchResponseTag[];
}

export interface SearchResponse {
    results: SearchResponseItem[];
}
