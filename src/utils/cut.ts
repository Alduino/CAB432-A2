/**
 * Splits the string at the specified points
 */
export default function cut(src: string, points: number[]): string[] {
    const result = new Array(points.length + 1);

    let lastCut = 0;
    points.forEach((point, i) => {
        result[i] = src.substring(lastCut, point);
        lastCut = point;
    });

    result[points.length] = src.substring(lastCut);

    return result;
}

/**
 * Sorts the specified ranges, and merges any overlaps together. Note, this
 * operation happens [in-place](https://en.wikipedia.org/wiki/In-place_algorithm)
 * in the array, so if you don't want it modified, `slice()` it first.
 * @returns the same array instance that was passed in
 */
export function mergeCutRanges(ranges: [from: number, to: number][]) {
    ranges.sort((a, b) => a[0] - b[0]);

    for (let i = 0; i < ranges.length; i++) {
        let [, to] = ranges[i];

        for (let nextIndex = i + 1; nextIndex < ranges.length; nextIndex++) {
            const [nextFrom, nextTo] = ranges[nextIndex];
            if (nextFrom > to) break;

            if (nextTo > to) {
                to = nextTo;
            }

            ranges.splice(nextIndex, 1);
            nextIndex--;
        }
    }

    return ranges;
}
