import {useCallback, useState} from "react";
import useDebounceProvider from "./useDebounceProvider";

/**
 * Debounces any change to the state
 * @param initialState The initial state to return
 * @param debounceTime Amount of time in milliseconds to debounce
 */
export default function useDebouncedState<T>(
    initialState: T,
    debounceTime: number
): [T, (v: T) => void] {
    const [debouncedState, setDebouncedState] = useState(initialState);
    const debounce = useDebounceProvider(debounceTime);

    const setStateWithDebounce = useCallback(
        (state: T) => {
            debounce(() => setDebouncedState(state));
        },
        [debounce, setDebouncedState]
    );

    return [debouncedState, setStateWithDebounce];
}
