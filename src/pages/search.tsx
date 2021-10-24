import {useFetch} from "@alduino/api-utils";
import {
    Heading,
    HStack,
    Spinner,
    Stack,
    StackDivider,
    Tag,
    Text
} from "@chakra-ui/react";
import {useEffect, useMemo, useState} from "react";
import SearchRequest from "../api-types/SearchRequest";
import {SearchResponseItem} from "../api-types/SearchResponse";
import {ByLine} from "../components/ByLine";
import {Container} from "../components/Container";
import {MainStack} from "../components/MainStack";
import {SearchBox, useSearchTags} from "../components/SearchBox";
import {searchEndpoint} from "../hooks/api-client";
import useDebouncedState from "../hooks/useDebouncedState";
import {useShortStale} from "../hooks/useShortStale";

interface SearchResultProps {
    result: SearchResponseItem;
}

function SearchResult({result}: SearchResultProps) {
    return (
        <Stack p={4}>
            <Heading fontWeight="400" size="md">
                {result.title.map((part, i) =>
                    i % 2 ? <strong key={i}>{part}</strong> : part
                )}
            </Heading>
            <ByLine
                author={result.author}
                wasAuthorMatch={result.wasAuthorMatch}
                link={result.link}
                wasLinkMatch={result.wasLinkMatch}
                published={new Date(result.published)}
            />
            <HStack>
                {result.tags.map(tag => (
                    <Tag
                        key={tag.name}
                        size="sm"
                        fontWeight={tag.wasMatched ? "bold" : "normal"}
                    >
                        {tag.name}
                    </Tag>
                ))}
            </HStack>
        </Stack>
    );
}

export default function SearchMockup() {
    const [textboxValue, setTextboxValue] = useState("");
    const [searchTerm, setSearchTerm] = useDebouncedState(textboxValue, 200);
    const [searchTags, searchTagsDispatch] = useSearchTags();

    const searchRequest = useMemo<SearchRequest>(
        () => ({
            term: searchTerm,
            tags: searchTags
        }),
        [searchTerm, searchTags]
    );

    const {
        result: searchResults,
        loading: searchLoading,
        execute: triggerSearchRequest,
        set: overrideSearchResults
    } = useFetch(searchEndpoint, searchRequest);
    const staleSearch = useShortStale(searchResults, !searchLoading);

    useEffect(() => {
        setSearchTerm(textboxValue);
    }, [setSearchTerm, textboxValue]);

    useEffect(() => {
        if (searchTerm || searchTags.length) triggerSearchRequest();
        else {
            overrideSearchResults({
                loading: false,
                result: {results: []},
                status: "success",
                error: undefined
            });
        }
    }, [searchRequest, searchTerm, searchTags]);

    const title =
        searchTerm && searchResults
            ? `${searchResults.results.length} results`
            : "Search";

    return (
        <Container title={`${title} - Artiller`}>
            <MainStack>
                <Stack
                    p={8}
                    direction="column"
                    spacing={6}
                    divider={<StackDivider />}
                >
                    <SearchBox
                        w="full"
                        term={textboxValue}
                        tags={searchTags}
                        onTermChanged={setTextboxValue}
                        tagsDispatch={searchTagsDispatch}
                    />
                    <Stack spacing={4}>
                        {staleSearch ? (
                            staleSearch.results.length > 0 ? (
                                staleSearch.results.map(result => (
                                    <SearchResult
                                        key={result.link}
                                        result={result}
                                    />
                                ))
                            ) : (
                                <Text opacity={0.8}>
                                    We couldn&apos;t find any results for that
                                    search
                                </Text>
                            )
                        ) : (
                            <Spinner />
                        )}
                    </Stack>
                </Stack>
            </MainStack>
        </Container>
    );
}