import {Heading, HStack, Stack, StackDivider, Tag} from "@chakra-ui/react";
import {ByLine} from "../components/ByLine";
import {Container} from "../components/Container";
import {MainStack} from "../components/MainStack";
import {SearchBox} from "../components/SearchBox";

function SearchResult() {
    return (
        <Stack p={4}>
            <Heading fontWeight="400" size="md">Did <strong>Apple</strong> just ruin an almost perfect new <strong>MacBook</strong> design?</Heading>
            <ByLine author="Michael Myers" link="https://linustechtips.com/insert-link-here" published={new Date()} />
            <HStack>
                <Tag size="sm" fontWeight="bold">apple</Tag>
                <Tag size="sm">macbook</Tag>
                <Tag size="sm">macbook-pro</Tag>
            </HStack>
        </Stack>
    )
}

export default function SearchMockup() {
    return (
        <Container title="macbook 2021 - Artiller">
            <MainStack>
                <Stack p={8} direction="column" spacing={6} divider={<StackDivider />}>
                    <SearchBox w="full" />
                    <Stack spacing={4}>
                        <SearchResult />
                        <SearchResult />
                        <SearchResult />
                        <SearchResult />
                        <SearchResult />
                    </Stack>
                </Stack>
            </MainStack>
        </Container>
    );
}
