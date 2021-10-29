const splitRegex = /\s+/g;
const invalidCharacterRegex = /[^a-z0-9]/gi;

export default function getMatchableWords(term: string): string[] {
    return term
        .replace(invalidCharacterRegex, " ")
        .split(splitRegex)
        .map(word => word.trim().toLowerCase())
        .filter(Boolean);
}
