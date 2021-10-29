import {useSwr} from "@alduino/api-utils";
import {Box, Heading, Stack, Text, VStack} from "@chakra-ui/react";
import {GetServerSideProps} from "next";
import {useRouter} from "next/router";
import {ReactElement, useCallback} from "react";
import StatsResponse from "../api-types/StatsResponse";
import getStats from "../backend/stats";
import {Container} from "../components/Container";
import {Logo} from "../components/Logo";
import {SearchBox} from "../components/SearchBox";
import {statsEndpoint} from "../hooks/api-client";
import {beginCollectingSearchTerm} from "../utils/collect-search-term";
import formatNumber from "../utils/formatNumber";
import noop from "../utils/noop";

const emptyTags = [];

interface IndexProps {
    stats: StatsResponse;
}

export default function Index({stats: statsInitial}: IndexProps): ReactElement {
    const {replace} = useRouter();

    const handleTermChanged = useCallback(
        term => {
            try {
                const parsedUrl = new URL(term);
                replace(`/import?url=${encodeURIComponent(parsedUrl.toString())}`);
            } catch {
                beginCollectingSearchTerm(term);
                replace(`/search?term=${encodeURIComponent(term)}`, "/search");
            }
        },
        [replace]
    );

    const {data: statsUnformatted} = useSwr(statsEndpoint, noop, {
        fallbackData: statsInitial
    });

    const stats =
        statsUnformatted &&
        Object.fromEntries(
            Object.entries(statsUnformatted).map(([name, count]) => [
                name,
                formatNumber(count)
            ])
        );

    return (
        <Container title="Artiller">
            <Stack w={["full", "lg"]}>
                <Box flexGrow={0.4} />
                <VStack spacing={6}>
                    <Logo size={16} />
                    <Heading size="md">Artiller</Heading>
                    <SearchBox
                        w="full"
                        term=""
                        tags={emptyTags}
                        onTermChanged={handleTermChanged}
                        placeholder="Search or paste a URL"
                    />
                </VStack>
                <Box flexGrow={1} />
                {stats && (
                    <VStack spacing={1} fontSize="xs" opacity={0.5}>
                        <Text>
                            So far, we&rsquo;ve indexed more than {stats.tags}{" "}
                            tags across {stats.articles} articles by{" "}
                            {stats.authors} creators, with{" "}
                            {stats.tagSearchQueueSize} more tags,{" "}
                            {stats.wordSearchQueueSize} more words, and tags for{" "}
                            {stats.tagDiscoveryQueueSize} articles, coming soon.
                        </Text>
                    </VStack>
                )}
            </Stack>
        </Container>
    );
}

export const getServerSideProps: GetServerSideProps<IndexProps> = async () => {
    const stats = await getStats();
    return {props: {stats}};
};
