import useConstant from "use-constant";
import {createDebounce, DebounceFunction} from "../utils/debounce";

export default function useDebounceProvider<T>(
    time: number
): DebounceFunction<T> {
    return useConstant(() => createDebounce<T>(time));
}
