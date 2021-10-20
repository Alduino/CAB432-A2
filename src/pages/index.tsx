import {Heading, Stack, StackDivider, useColorModeValue} from "@chakra-ui/react";
import Head from "next/head";
import {ByLine} from "../components/ByLine";
import {Container} from "../components/Container";

export default function Index() {
    const faviconPath = useColorModeValue("/assets/logo-black.svg", "/assets/logo-white.svg");

    return (
        <Container>
            <Head>
                <link rel="icon" href={faviconPath} />
            </Head>

            <Stack direction="row" divider={<StackDivider />}>
                <Stack w="38%" p={8} spacing={4}>
                    <Heading size="md">
                        Did Apple just ruin an almost perfect new MacBook Pro
                        design?
                    </Heading>
                    <ByLine author="Michael Myers" published={new Date()} />
                </Stack>
            </Stack>
        </Container>
    );
}
