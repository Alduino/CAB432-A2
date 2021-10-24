import {Dispatch, SetStateAction, useState} from "react";
import {wrapNumber} from "../utils/wrapNumber";

/**
 * Wraps the state to be between a and b.
 * Can operate with either inclusive min and exclusive max (IE mode), or exclusive min and inclusive max (EI mode)
 * @param a For IE mode, the maximum value. For EI mode, the minimum value.
 * @param b For IE mode, the minimum value. For EI mode, the maximum value.
 * @param initial The initial value to use
 */
export default function useWrappingState(
    a: number,
    b = 0,
    initial = 0
): [number, Dispatch<SetStateAction<number>>] {
    const [state, setState] = useState(initial);
    return [wrapNumber(state, a, b), setState];
}
