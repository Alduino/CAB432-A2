import {useEffect, useState} from "react";

export interface UseTextWidthResult {
    ref: (el: Element) => void;
    width: number;
}

/**
 * Returns the width of the specified string, based on the styles of the reference
 */
export default function useTextWidth(
    text: string
): UseTextWidthResult {
    const [sourceElem, setSourceElem] = useState<Element>();
    const [measureElem, setMeasureElem] = useState<HTMLSpanElement>();
    const [width, setWidth] = useState<number>(0);

    useEffect(() => {
        if (!sourceElem) return;

        const targetElem = document.createElement("span");
        const computedStyles = getComputedStyle(sourceElem);

        const fontStyleKeys = Object.values(computedStyles).filter(v =>
            v.startsWith("font")
        );

        for (const key of fontStyleKeys) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            targetElem.style[key] = computedStyles[key];
        }

        targetElem.className = "__useTextWidth";
        targetElem.style.position = "fixed";
        targetElem.style.top = "10px";
        targetElem.style.left = "10px";
        targetElem.style.opacity = "0";
        targetElem.style.pointerEvents = "none";
        targetElem.style.whiteSpace = "pre";

        document.body.appendChild(targetElem);
        setMeasureElem(targetElem);

        return () => targetElem.remove();
    }, [sourceElem]);

    useEffect(() => {
        if (!measureElem) return;

        measureElem.textContent = text;
        setWidth(measureElem.scrollWidth);
    }, [text, measureElem]);

    return {
        ref: setSourceElem,
        width
    };
}
