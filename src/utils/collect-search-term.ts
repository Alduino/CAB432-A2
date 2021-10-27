const collectorInputId = "search-term-collector";

/**
 * Begins collecting a search term globally, until `stopCollectingSearchTerm`
 * is called
 * @param pre An initial value to prepend
 */
export function beginCollectingSearchTerm(pre: string) {
    const targetElement = document.createElement("input");
    targetElement.value = pre;
    targetElement.style.position = "fixed";
    targetElement.style.width = "0px";
    targetElement.style.left = "-10px";
    targetElement.id = collectorInputId;
    document.body.appendChild(targetElement);
    targetElement.focus({preventScroll: true});
}

/**
 * Stops collecting the search term and returns it
 */
export function stopCollectingSearchTerm(): string {
    const targetElement = document.getElementById(collectorInputId) as HTMLInputElement;
    if (!targetElement) return "";
    targetElement.remove();
    return targetElement.value;
}
