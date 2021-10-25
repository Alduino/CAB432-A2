import {KeyboardEventHandler, useCallback} from "react";
import useWrappingState from "./useWrappingState";

export interface UseListControlsResult {
    currentIndex: number;
    onKeyDown: KeyboardEventHandler;
    setCurrentIndex(idx: number): void;
}

export default function useListControls(
    items: number
): UseListControlsResult {
    const [index, setIndex] = useWrappingState(items);

    const handleKeyDown = useCallback<KeyboardEventHandler>(
        ev => {
            if (ev.key === "ArrowDown") {
                ev.preventDefault();
                setIndex(idx => idx + 1);
            } else if (ev.key === "ArrowUp") {
                ev.preventDefault();
                setIndex(idx => idx - 1);
            }
        },
        [setIndex]
    );

    return {
        currentIndex: index,
        setCurrentIndex: setIndex,
        onKeyDown: handleKeyDown
    };
}
