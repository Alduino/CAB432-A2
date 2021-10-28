import {useSwr} from "@alduino/api-utils";
import {Box, Center, Heading, Text, VStack} from "@chakra-ui/react";
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
import noop from "../utils/noop";

const emptyTags = [];

interface IndexProps {
    stats: StatsResponse;
}

export default function Index({stats: statsInitial}: IndexProps): ReactElement {
    const {replace} = useRouter();

    const handleTermChanged = useCallback(
        term => {
            beginCollectingSearchTerm(term);
            replace(`/search?term=${encodeURIComponent(term)}`, "/search");
        },
        [replace]
    );

    const {data: stats} = useSwr(statsEndpoint, noop, {
        fallbackData: statsInitial
    });

    return (
        <Container title="Artiller">
            <Center flexDir="column">
                <VStack spacing={6}>
                    <Logo size={16} />
                    <Heading size="md">Artiller</Heading>
                    <SearchBox
                        term=""
                        tags={emptyTags}
                        onTermChanged={handleTermChanged}
                    />
                    {stats && (
                        <Text fontSize="xs" opacity={0.5} w="md">
                            So far, we&rsquo;ve indexed more than {stats.tags}{" "}
                            tags across {stats.articles} articles by{" "}
                            {stats.authors} creators, with{" "}
                            {stats.tagSearchQueueSize} more tags coming soon.
                        </Text>
                    )}
                </VStack>
                <Box h="30vh" />
            </Center>
        </Container>
    );
}

export const getServerSideProps: GetServerSideProps<IndexProps> = async () => {
    const stats = await getStats();
    return {props: {stats}};
};
