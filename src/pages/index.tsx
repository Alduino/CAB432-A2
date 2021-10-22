import {Box, Center, Heading, VStack} from "@chakra-ui/react";
import {ReactElement} from "react";
import {Container} from "../components/Container";
import {Logo} from "../components/Logo";
import {SearchBox} from "../components/SearchBox";

export default function Index(): ReactElement {
    return (
        <Container title="Artiller">
            <Center flexDir="column">
                <VStack spacing={6}>
                    <Logo size={16} />
                    <Heading size="md">Artiller</Heading>
                    <SearchBox />
                </VStack>
                <Box h="30vh" />
            </Center>
        </Container>
    );
}
