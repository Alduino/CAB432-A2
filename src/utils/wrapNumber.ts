import modulo from "./modulo";

/**
 * Wraps a number to be between a and b.
 * Can operate with either inclusive min and exclusive max (IE mode), or exclusive min and inclusive max (EI mode)
 * @param value
 * @param a For IE mode, the maximum value. For EI mode, the minimum value.
 * @param b For IE mode, the minimum value. For EI mode, the maximum value.
 */
export function wrapNumber(value: number, a: number, b: number) {
    return modulo((value - b), (a - b)) + b;
}
