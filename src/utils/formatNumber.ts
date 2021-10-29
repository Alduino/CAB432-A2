const postfixes = [
    [1, ""],
    [1e3, "k"],
    [1e6, "M"],
    [1e9, "G"],
    [1e12, "T"],
    [1e15, "P"],
    [1e18, "E"],
    [1e21, "Z"],
    [1e24, "Y"]
].reverse() as [number, string][];

/**
 * Adds the k, M, etc postfix to the number, and rounds it to the specified
 * significant digits.
 * @remarks Only supports positive integers
 */
export default function formatNumber(
    num: number,
    significantDigits = 2
): string {
    if (num === 0) return "0";

    const [divisor, postfix] = postfixes.find(
        ([divider]) => num / divider >= 0.8
    );
    const divided = num / divisor;

    // TODO: Parsing the value as a float and then converting it back to a string is stupid.
    // why does toPrecision convert to scientific notation??
    const numString = parseFloat(
        divided.toPrecision(significantDigits)
    ).toString();
    const numStringWithoutZeroes = numString.replace(/\.0+$/, "");
    return numStringWithoutZeroes + postfix;
}
