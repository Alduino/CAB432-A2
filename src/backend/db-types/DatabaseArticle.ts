export default interface DatabaseArticle {
    id: string;
    source_id: string;
    title: string;
    author: string;
    link: string;
    link_domain: string;
    published: Date;
    paragraphs: string[];
}
