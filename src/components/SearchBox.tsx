import {SearchIcon} from "@chakra-ui/icons";
import {
    Box,
    Button,
    chakra,
    HStack,
    IconButton,
    Input,
    Stack,
    StackProps,
    Tag,
    TagCloseButton,
    TagLabel,
    useColorModeValue,
    useMergeRefs,
    useMultiStyleConfig
} from "@chakra-ui/react";
import {
    Dispatch,
    KeyboardEventHandler,
    useCallback,
    useDebugValue,
    useMemo,
    useReducer,
    useRef,
    useState
} from "react";
import {SearchTag} from "../api-types/SearchTag";
import useListControls from "../hooks/useListControls";
import useTextWidth from "../hooks/useTextWidth";
import normaliseTag from "../utils/normaliseTag";

type MapActionObjectToActions<T> = {
    [Key in keyof T]: T[Key] extends void ? {type: Key} : {type: Key} & T[Key];
}[keyof T];

export type SearchTagsActions = MapActionObjectToActions<{
    /**
     * Adds a new tag to the search
     */
    add: {
        tag: SearchTag;
    };

    /**
     * Removes a tag from the search. Must be the exact instance.
     */
    remove: {
        tag: SearchTag;
    };

    /**
     * Removes the last tag from the search
     */
    pop: void;
}>;

export function useSearchTags(
    initialState: SearchTag[] = []
): [tags: SearchTag[], dispatch: Dispatch<SearchTagsActions>] {
    const [value, dispatch] = useReducer(
        (state: SearchTag[], action: SearchTagsActions) => {
            switch (action.type) {
                case "pop":
                    return state.slice(0, state.length - 1);
                case "add":
                    return [...state, action.tag];
                case "remove": {
                    const idx = state.indexOf(action.tag);
                    if (idx === -1)
                        throw new Error("Cannot remove tag that doesn't exist");
                    return [...state.slice(0, idx), ...state.slice(idx + 1)];
                }
            }
        },
        initialState
    );

    useDebugValue(value.map(tag => `${tag.kind}:${tag.value}`));

    return [value, dispatch];
}

interface SearchBoxProps extends StackProps {
    term: string;
    tags: SearchTag[];
    tagsDispatch?: Dispatch<SearchTagsActions>;

    onTermChanged?(term: string): void;

    onManualTrigger?(): void;
}

export function SearchBox({
    term,
    tags,
    onTermChanged,
    tagsDispatch,
    onManualTrigger,
    ...props
}: SearchBoxProps) {
    const mainInput = useRef<HTMLInputElement>();
    const inputContainerStyles = useMultiStyleConfig("Input", {});
    const [editingTagKind, setEditingTagKind] = useState<
        SearchTag["kind"] | null
    >(null);

    const autocompleteBackground = useColorModeValue("gray.50", "gray.700");

    const [editTagValue, setEditTagValue] = useState("");
    const {width: editTagWidth, ref: editTagRef} = useTextWidth(editTagValue);
    const {width: mainSearchWidth, ref: mainSearchRef} = useTextWidth(term);

    const mainInputCombinedRef = useMergeRefs(mainInput, mainSearchRef);

    const autocompleteItems = useMemo(() => {
        const termTrimmed = term.trim();
        if (!termTrimmed) return [];

        const possible: SearchTag["kind"][] = ["author", "www"];
        return termTrimmed === ":"
            ? possible
            : possible.filter(kind => kind.indexOf(termTrimmed) === 0);
    }, [term]);

    const {
        currentIndex: currentAutocompleteIndex,
        setCurrentIndex: setCurrentAutocompleteIndex,
        onKeyDown: onAutocompleteKeydown
    } = useListControls(autocompleteItems.length);

    const beginEditingTag = useCallback(
        (idx: number) => {
            setEditingTagKind(autocompleteItems[idx]);
            onTermChanged("");
        },
        [setEditingTagKind, autocompleteItems]
    );

    const handleKeydown = useCallback<KeyboardEventHandler<HTMLInputElement>>(
        ev => {
            const termNormalised = normaliseTag(term);

            if (ev.key === "Backspace" && term.length === 0) {
                // Delete the last tag (similar to backspace with normal text)
                tagsDispatch({type: "pop"});
                ev.preventDefault();
            } else if (
                (ev.key === ":" || ev.key === "Enter") &&
                autocompleteItems.length > 0
            ) {
                // Begin editing a tag
                beginEditingTag(currentAutocompleteIndex);
                ev.preventDefault();
            } else if (
                termNormalised.length > 0 &&
                !tags.some(
                    tag => tag.kind === "normal" && tag.value === termNormalised
                ) &&
                (ev.key === "," || ev.key === "Enter") &&
                !term.trim().includes(" ")
            ) {
                // Add a normal tag
                tagsDispatch({
                    type: "add",
                    tag: {kind: "normal", value: termNormalised}
                });

                onTermChanged("");
                ev.preventDefault();
            } else {
                onAutocompleteKeydown(ev);
            }
        },
        [
            term,
            tags,
            tagsDispatch,
            setEditingTagKind,
            beginEditingTag,
            currentAutocompleteIndex,
            onAutocompleteKeydown
        ]
    );

    const cancelTagEdit = useCallback(() => {
        setEditingTagKind(null);
        setEditTagValue("");
        setCurrentAutocompleteIndex(0);

        if (mainInput.current) {
            mainInput.current.focus();
        }
    }, [
        setEditingTagKind,
        setEditTagValue,
        setCurrentAutocompleteIndex,
        mainInput
    ]);

    const commitTagEdit = useCallback(() => {
        tagsDispatch({
            type: "add",
            tag: {
                kind: editingTagKind,
                value: editTagValue
            }
        });

        cancelTagEdit();
    }, [tagsDispatch, editingTagKind, editTagValue, cancelTagEdit]);

    const handleTagEditKeydown = useCallback<
        KeyboardEventHandler<HTMLInputElement>
    >(
        ev => {
            const valueTrimmed = editTagValue.trim();

            if ((ev.key === "Enter" || ev.key === "Tab") && valueTrimmed) {
                commitTagEdit();
                ev.preventDefault();
            } else if (
                ev.key === "Escape" ||
                (ev.key === "Backspace" && !valueTrimmed)
            ) {
                cancelTagEdit();
                ev.preventDefault();
            }
        },
        [editTagValue, commitTagEdit, cancelTagEdit]
    );

    return (
        <HStack
            spacing={0}
            sx={{
                ...inputContainerStyles.field,
                pl: 2,
                pr: 0,
                w: "lg"
            }}
            {...props}
        >
            <HStack flexGrow={1} spacing={0} overflowX="auto">
                <HStack mr={2}>
                    {Array.from(tags).map(tag => (
                        <Tag key={tag.kind + ":" + tag.value}>
                            <TagLabel>
                                {tag.kind === "normal" ? "" : tag.kind + ": "}
                                {tag.value}
                            </TagLabel>
                            <TagCloseButton
                                onClick={() =>
                                    tagsDispatch?.({type: "remove", tag})
                                }
                            />
                        </Tag>
                    ))}
                    {editingTagKind && (
                        <Tag as={HStack} spacing={0} pr={0}>
                            <chakra.span cursor="default" userSelect="none">
                                {editingTagKind}:
                            </chakra.span>
                            <Input
                                ref={editTagRef}
                                value={editTagValue}
                                onChange={ev => setEditTagValue(ev.target.value)}
                                onKeyDown={handleTagEditKeydown}
                                size="sm"
                                variant="unstyled"
                                autoFocus
                                pl={1}
                                style={{width: editTagWidth + 8 + "px"}}
                            />
                        </Tag>
                    )}
                </HStack>
                {autocompleteItems.length && (
                    <Box position="relative">
                        <Stack
                            position="absolute"
                            zIndex={1}
                            top={8}
                            bg={autocompleteBackground}
                            shadow="md"
                            spacing={0}
                            py={2}
                            rounded="md"
                            overflow="hidden"
                            userSelect="none"
                        >
                            {autocompleteItems.map((item, i) => (
                                <Button
                                    key={item}
                                    variant="ghost"
                                    p={2}
                                    rounded={0}
                                    isActive={i === currentAutocompleteIndex}
                                    onClick={() => beginEditingTag(i)}
                                >
                                    {item}:
                                </Button>
                            ))}
                        </Stack>
                    </Box>
                )}
                <Input
                    ref={mainInputCombinedRef}
                    variant="unstyled"
                    py={2}
                    flexGrow={1}
                    flexShrink={0}
                    type="search"
                    placeholder={tags.length ? "Search" : "Search or paste a URL"}
                    value={term}
                    onKeyDown={handleKeydown}
                    onChange={ev => onTermChanged?.(ev.target.value)}
                    onFocus={cancelTagEdit}
                    style={{width: `${mainSearchWidth + 8}px`}}
                    autoFocus
                />
            </HStack>
            <IconButton
                aria-label="Search"
                variant="ghost"
                color="gray.500"
                icon={<SearchIcon />}
                onClick={onManualTrigger}
            />
        </HStack>
    );
}
