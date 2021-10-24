export default interface Article {
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
     * The date that the article was published, converted to a ECMA-262 string
     */
    published: string;

    /**
     * The actual text of the article, without any formatting, split out into
     * each paragraph
     */
    paragraphs: string[];
}
