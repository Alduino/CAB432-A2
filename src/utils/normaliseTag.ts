export default function normaliseTag(tag: string) {
    return tag
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-");
}
