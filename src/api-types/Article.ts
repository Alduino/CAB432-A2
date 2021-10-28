export default interface Article {
    /**
     * A unique reference to this article
     */
    id: string;

    /**
     * The title text of the article, without any formatting
     */
    title: string;

    /**
     * The name of the person who wrote the article
     */
    author: string;

    /**
     * A link the user can go to to read the article
     */
    link: string;

    /**
     * List of tags from the article, normalised to lowercase and dash separated
     */
    tags: string[];

    /**
     * If this is true, this article is in the queue to have extra tags
     * generated for it
     */
    areExtraTagsLoading: boolean;

    /**
     * The date that the article was published, converted to a ECMA-262 string
     */
    published: string;

    /**
     * The actual text of the article, without any formatting, split out into
     * each paragraph
     */
    paragraphs: string[];
}
