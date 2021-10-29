import {useFetch} from "@alduino/api-utils";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Heading,
    HStack,
    Link,
    Spinner,
    Stack,
    StackDivider,
    Tag,
    Text,
    useBreakpointValue,
    Wrap,
    WrapItem
} from "@chakra-ui/react";
import NextLink from "next/link";
import {useRouter} from "next/router";
import {useEffect, useMemo, useState} from "react";
import useConstant from "use-constant";
import {isApiError} from "../api-types/ApiError";
import SearchRequest from "../api-types/SearchRequest";
import {SearchResponseItem} from "../api-types/SearchResponse";
import {SearchTag} from "../api-types/SearchTag";
import {ByLine} from "../components/ByLine";
import {Container} from "../components/Container";
import {MainStack} from "../components/MainStack";
import {SearchBox, useSearchTags} from "../components/SearchBox";
import {TagsLoadingNotification} from "../components/TagsLoadingNotification";
import {searchEndpoint} from "../hooks/api-client";
import useDebouncedState from "../hooks/useDebouncedState";
import {useShortStale} from "../hooks/useShortStale";
import {stopCollectingSearchTerm} from "../utils/collect-search-term";
import normaliseTag from "../utils/normaliseTag";
import {parseTag} from "../utils/parseTag";

interface SearchResultProps {
    result: SearchResponseItem;
}

function SearchResult({result}: SearchResultProps) {
    return (
        <Stack p={[0, null, 4]}>
            <Heading fontWeight="400" size="md">
                <NextLink href={`/article/${result.id}`} passHref>
                    <Link>
                        {result.title.map((part, i) =>
                            i % 2 ? <strong key={i}>{part}</strong> : part
                        )}
                    </Link>
                </NextLink>
            </Heading>
            <ByLine
                author={result.author}
                wasAuthorMatch={result.wasAuthorMatch}
                link={result.link}
                wasLinkMatch={result.wasLinkMatch}
                published={new Date(result.published)}
            />
            <Wrap>
                {result.tags.map(tag => (
                    <WrapItem key={tag.name}>
                        <Tag
                            size="sm"
                            fontWeight={tag.wasMatched ? "bold" : "normal"}
                        >
                            {tag.name}
                        </Tag>
                    </WrapItem>
                ))}
                {result.areExtraTagsLoading && <TagsLoadingNotification />}
            </Wrap>
        </Stack>
    );
}

export default function Search() {
    const {query} = useRouter();

    const useStackDivider = useBreakpointValue([true, null, false]);

    const initialTags: SearchTag[] = useConstant(() => {
        return (
            (Array.isArray(query.tags) ? query.tags.join(",") : query.tags)
                ?.split(",")
                .filter(Boolean)
                .map(parseTag) ?? []
        );
    });

    const initialTerm = useConstant(() => {
        const collectedSearch = stopCollectingSearchTerm();
        if (collectedSearch) return collectedSearch;

        if (Array.isArray(query.term)) return query.term.join(" ");
        return query.term ?? "";
    });

    const [textboxValue, setTextboxValue] = useState(initialTerm);
    const [searchTerm, setSearchTerm] = useDebouncedState(textboxValue, 1500);
    const [searchTags, searchTagsDispatch] = useSearchTags(initialTags);

    const searchRequest = useMemo<SearchRequest>(
        () => ({
            term: searchTerm,
            tags:
                searchTags.length === 0 && !/[\s,]/.test(searchTerm)
                    ? [
                          {
                              kind: "normal",
                              value: normaliseTag(searchTerm)
                          }
                      ]
                    : searchTags
        }),
        [searchTerm, searchTags]
    );

    const {
        result: searchResults,
        loading: searchLoading,
        error: searchError,
        execute: triggerSearchRequest,
        set: overrideSearchResults
    } = useFetch(searchEndpoint, searchRequest);
    const staleSearch = useShortStale(searchResults, !searchLoading);

    const [isSearchSlow, setIsSearchSlow] = useState(false);

    useEffect(() => {
        setIsSearchSlow(false);
        if (!searchLoading) return;

        const timeout = setTimeout(() => {
            setIsSearchSlow(true);
        }, 15000);

        return () => clearTimeout(timeout);
    }, [setIsSearchSlow, searchLoading, searchTerm]);

    useEffect(() => {
        setSearchTerm(textboxValue);
    }, [setSearchTerm, textboxValue]);

    useEffect(() => {
        if (searchTerm || searchTags.length) triggerSearchRequest();
        else {
            overrideSearchResults({
                loading: false,
                result: {results: [], count: 0},
                status: "success",
                error: undefined
            });
        }
    }, [searchRequest, searchTerm, searchTags]);

    const title =
        !isApiError(staleSearch) && staleSearch?.results?.length > 0
            ? `${staleSearch.count} results`
            : "Search";

    return (
        <Container title={`${title} - Artiller`}>
            <MainStack>
                <Stack
                    p={[0, null, 8]}
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
                        onManualTrigger={triggerSearchRequest}
                    />
                    <Stack
                        spacing={4}
                        divider={useStackDivider && <StackDivider />}
                    >
                        {searchError || isApiError(staleSearch) ? (
                            <Alert status="error">
                                <AlertIcon />
                                <AlertTitle>Oops!</AlertTitle>
                                <AlertDescription>
                                    For some reason, your search failed.
                                    We&rsquo;ve already been notified.
                                </AlertDescription>
                            </Alert>
                        ) : staleSearch?.results ? (
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
                        ) : isSearchSlow ? (
                            <HStack>
                                <Spinner />
                                <Text opacity={0.8}>
                                    This search is taking a while. If it
                                    doesn&rsquo;t finish soon, please refresh
                                    the page.
                                </Text>
                            </HStack>
                        ) : (
                            <Spinner />
                        )}
                    </Stack>
                </Stack>
            </MainStack>
        </Container>
    );
}
