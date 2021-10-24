import {SearchIcon} from "@chakra-ui/icons";
import {
    Box,
    chakra,
    HStack,
    IconButton,
    Input,
    InputGroup,
    InputRightElement,
    StackProps,
    Tag,
    TagCloseButton,
    TagLabel,
    useColorModeValue,
    useMultiStyleConfig
} from "@chakra-ui/react";
import {
    Dispatch,
    KeyboardEventHandler,
    useCallback,
    useMemo,
    useReducer, useRef,
    useState
} from "react";
import {SearchTag} from "../api-types/SearchTag";
import useListControls from "../hooks/useListControls";
import useTextWidth from "../hooks/useTextWidth";

type MapActionObjectToActions<T> = {
    [Key in keyof T]: T[Key] extends void ? {type: Key} : {type: Key} & T[Key];
}[keyof T];

type SearchTagsActions = MapActionObjectToActions<{
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

export function useSearchTags(): [
    tags: SearchTag[],
    dispatch: Dispatch<SearchTagsActions>
] {
    return useReducer((state: SearchTag[], action: SearchTagsActions) => {
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
    }, []);
}

interface SearchBoxProps extends StackProps {
    term: string;
    tags: SearchTag[];
    tagsDispatch?: Dispatch<SearchTagsActions>;

    onTermChanged?(term: string): void;
}

export function SearchBox({
    term,
    tags,
    onTermChanged,
    tagsDispatch,
    ...props
}: SearchBoxProps) {
    const mainInput = useRef<HTMLInputElement>();
    const inputContainerStyles = useMultiStyleConfig("Input", {});
    const autocompleteBackground = useColorModeValue("gray.300", "gray.700");
    const [editingTagKind, setEditingTagKind] = useState<
        SearchTag["kind"] | null
    >(null);

    const [editTagValue, setEditTagValue] = useState("");
    const {width: editTagWidth, ref: editTagRef} = useTextWidth(editTagValue);

    const autocompleteItems = useMemo(() => {
        const termTrimmed = term.trim();
        if (!termTrimmed) return [];

        const possible: SearchTag["kind"][] = ["author", "www"];
        return possible.filter(kind => kind.indexOf(termTrimmed) === 0);
    }, [term]);

    const {
        currentIndex: currentAutocompleteIndex,
        onKeyDown: onAutocompleteKeydown
    } = useListControls(autocompleteItems.length);

    const handleKeydown = useCallback<KeyboardEventHandler<HTMLInputElement>>(
        ev => {
            const termTrimmed = term.trim();

            if (ev.key === "Backspace" && term.length === 0) {
                tagsDispatch({type: "pop"});
                ev.preventDefault();
            } else if (
                (ev.key === ":" || ev.key === "Enter") &&
                autocompleteItems.length > 0
            ) {
                setEditingTagKind(autocompleteItems[currentAutocompleteIndex]);
                onTermChanged("");
                ev.preventDefault();
            } else if (
                termTrimmed.length > 0 &&
                !tags.some(
                    tag => tag.kind === "normal" && tag.value === termTrimmed
                ) &&
                (ev.key === "," || ev.key === "Enter") &&
                !termTrimmed.includes(" ")
            ) {
                tagsDispatch({
                    type: "add",
                    tag: {kind: "normal", value: termTrimmed}
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
            currentAutocompleteIndex,
            onAutocompleteKeydown
        ]
    );

    const cancelTagEdit = useCallback(() => {
        setEditingTagKind(null);
        setEditTagValue("");

        if (mainInput.current) {
            mainInput.current.focus();
        }
    }, [setEditingTagKind, setEditTagValue, mainInput]);

    const commitTagEdit = useCallback(() => {
        tagsDispatch({
            type: "add", tag: {
                kind: editingTagKind,
                value: editTagValue
            }
        });

        cancelTagEdit();
    }, [tagsDispatch, editingTagKind, editTagValue, cancelTagEdit]);

    const handleTagEditKeydown = useCallback<KeyboardEventHandler<HTMLInputElement>>(ev => {
        const valueTrimmed = editTagValue.trim();

        if ((ev.key === "Enter" || ev.key === "Tab") && valueTrimmed) {
            commitTagEdit();
            ev.preventDefault();
        } else if (ev.key === "Escape" || (ev.key === "Backspace" && !valueTrimmed)) {
            cancelTagEdit();
            ev.preventDefault();
        }
    }, [editTagValue, commitTagEdit, cancelTagEdit]);

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
            <HStack>
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
            <InputGroup position="relative">
                {autocompleteItems.length && (
                    <Box
                        position="absolute"
                        zIndex={1}
                        top={8}
                        bg={autocompleteBackground}
                        shadow="md"
                        py={2}
                        rounded="md"
                        overflow="hidden"
                        userSelect="none"
                    >
                        {autocompleteItems.map((item, i) => (
                            <Box
                                key={item}
                                bg={
                                    i === currentAutocompleteIndex &&
                                    "whiteAlpha.300"
                                }
                                p={2}
                            >
                                {item}:
                            </Box>
                        ))}
                    </Box>
                )}
                <Input
                    ref={mainInput}
                    flexGrow={1}
                    variant="unstyled"
                    pl={2}
                    py={2}
                    type="search"
                    placeholder={tags.length ? "Search" : "Search or paste a URL"}
                    value={term}
                    onKeyDown={handleKeydown}
                    onChange={ev => onTermChanged?.(ev.target.value)}
                    onFocus={cancelTagEdit}
                />
                <InputRightElement
                    as={IconButton}
                    aria-label="Search"
                    variant="ghost"
                    color="gray.500"
                    icon={<SearchIcon />}
                />
            </InputGroup>
        </HStack>
    );
}
