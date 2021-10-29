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
 * Adds the k, M, etc postfix to the number
 * @remarks Only supports positive integers
 */
export default function formatNumber(num: number, significantDigits = 2): string {
    if (num === 0) return "0";

    const [divisor, postfix] = postfixes.find(([divider]) => num / divider >= 0.8);
    const divided = num / divisor;

    const decimals = Math.floor(Math.log10(divided)) - significantDigits + 1;
    const multiplier = 10 ** decimals;
    const numString = Math.floor(divided / multiplier) * multiplier;

    return numString + postfix;
}
