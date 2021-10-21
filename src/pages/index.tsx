import {
    Box,
    Button,
    Heading,
    HStack,
    Link,
    Stack,
    StackDivider,
    Tag,
    Text,
    useColorModeValue
} from "@chakra-ui/react";
import Head from "next/head";
import {ByLine} from "../components/ByLine";
import {Container} from "../components/Container";

export default function Index() {
    const faviconPath = useColorModeValue(
        "/assets/logo-black.svg",
        "/assets/logo-white.svg"
    );

    return (
        <Container>
            <Head>
                <link rel="icon" href={faviconPath} />
            </Head>

            <Stack height="full" direction="row" divider={<StackDivider />}>
                <Stack flexGrow={1} p={8} spacing={4}>
                    <Heading size="md">
                        Did Apple just ruin an almost perfect new MacBook Pro
                        design?
                    </Heading>
                    <ByLine author="Michael Myers" published={new Date()} />
                    <HStack>
                        <Tag>apple</Tag>
                        <Tag>macbook</Tag>
                        <Tag>macbook-pro</Tag>
                    </HStack>
                    <Box />
                    <HStack>
                        <Button variant="outline" colorScheme="gray">
                            Find similar articles
                        </Button>
                    </HStack>
                    <Box flexGrow={1} />
                    <HStack spacing={1} fontSize="sm" opacity={.8}>
                        <Text opacity={.8}>
                            Something broken? Read this article on
                        </Text>
                        <Link href="#">a-news-website.com</Link>
                    </HStack>
                </Stack>
                <Stack w="62%" p={12} spacing={4}>
                    <Text>Lorem ipsum dolor sit amet, ...</Text>
                    <Text>I&rsquo;m not copying all that text into code.</Text>
                </Stack>
            </Stack>
        </Container>
    );
}
