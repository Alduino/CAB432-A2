/**
 * Splits the string at the specified points
 */
export default function cut(src: string, points: number[]): string[] {
    const result = new Array(points.length + 1);

    let lastCut = 0;
    points.forEach((point, i) => {
        result[i] = src.substring(lastCut, point);
        lastCut = point;

        if (i === points.length - 1) {
            result[points.length] = src.substring(lastCut);
        }
    });

    return result;
}
