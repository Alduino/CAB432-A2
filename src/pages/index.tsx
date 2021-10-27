import {Box, Center, Heading, VStack} from "@chakra-ui/react";
import {useRouter} from "next/router";
import {ReactElement, useCallback} from "react";
import {Container} from "../components/Container";
import {Logo} from "../components/Logo";
import {SearchBox} from "../components/SearchBox";
import {beginCollectingSearchTerm} from "../utils/collect-search-term";

const emptyTags = [];

export default function Index(): ReactElement {
    const {replace} = useRouter();

    const handleTermChanged = useCallback(
        term => {
            beginCollectingSearchTerm(term);
            replace(`/search?term=${encodeURIComponent(term)}`, "/search");
        },
        [replace]
    );

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
                </VStack>
                <Box h="30vh" />
            </Center>
        </Container>
    );
}
