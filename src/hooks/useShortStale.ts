import {useEffect} from "react";
import {useImpCutValue} from "./cutValue";

/**
 * Keeps `value` while `edge` is true, and for the first `staleTime` ms of `edge` being false
 * @param value The value to return
 * @param edge Whether or not the value is stale or not (false = stale)
 * @param staleTime The amount of time a stale value is allowed before `value` will be sampled again
 *
 * @example Sends a request every time `state` changes, but will wait 300ms before showing a loading icon
 * const {execute, result, loading} = useFetch(...);
 * useEffect(() => execute(), [state]);
 * const data = useShortStale(result, !loading);
 * return data ? "Got some data" : "Still loading";
 */
export function useShortStale<T>(value: T, edge: boolean, staleTime = 300): T {
    const [result, cut] = useImpCutValue(value);

    useEffect(() => {
        if (edge) return;

        const timeout = setTimeout(() => cut(), staleTime);
        return () => clearTimeout(timeout);
    }, [edge, cut, staleTime]);

    useEffect(() => {
        if (!edge) return;
        cut();
    }, [edge, cut]);

    return result;
}
