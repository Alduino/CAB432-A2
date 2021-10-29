import {useFetch} from "@alduino/api-utils";
import {Box, Code, Link, Text, VStack} from "@chakra-ui/react";
import {GetServerSideProps} from "next";
import NextLink from "next/link";
import {useRouter} from "next/router";
import {ReactElement, useEffect, useMemo} from "react";
import {isApiError, stringifyApiError} from "../api-types/ApiError";
import ImportRequest from "../api-types/ImportRequest";
import {Container} from "../components/Container";
import {Logo} from "../components/Logo";
import {importEndpoint} from "../hooks/api-client";
import useWrappingState from "../hooks/useWrappingState";

interface ImportProps {
    url: string;
}

export default function Import({url}: ImportProps): ReactElement {
    const [dotCount, setDotCount] = useWrappingState(4, 0, 1);
    const {replace} = useRouter();

    useEffect(() => {
        const interval = setInterval(() => {
            setDotCount(prev => prev + 1);
        }, 500);

        return () => clearInterval(interval);
    }, [setDotCount]);

    const importRequest = useMemo<ImportRequest>(
        () => ({
            url
        }),
        [url]
    );

    const {result, error, execute} = useFetch(importEndpoint, importRequest);

    useEffect(() => {
        execute();
    }, []);

    useEffect(() => {
        if (!isApiError(result) && result?.success) {
            replace(`/article/${result.id}`);
        }
    }, [result]);

    return (
        <Container title="Importing an article">
            <VStack spacing={6}>
                <Box flexGrow={0.4} />
                <Logo size={16} />
                {error || isApiError(result) ? (
                    <>
                        <Text>Sorry, we couldn&rsquo;t import that page.</Text>
                        <Text fontSize="sm" opacity={0.5}>
                            <NextLink href="/" passHref>
                                <Link>Go back home.</Link>
                            </NextLink>
                        </Text>
                    </>
                ) : result ? (
                    <Text>Done! We&rsquo;ll redirect you in a moment.</Text>
                ) : (
                    <>
                        <Text>
                            Importing, please wait{".".repeat(dotCount)}
                        </Text>
                        <Text fontSize="sm" opacity={0.5}>
                            Don&rsquo;t close this tab. We&rsquo;ll redirect you
                            once the article is ready.
                        </Text>
                    </>
                )}
                <Box flexGrow={1} />
                {isApiError(result) && (
                    <Code fontSize="xs">{stringifyApiError(result)}</Code>
                )}
            </VStack>
        </Container>
    );
}

export const getServerSideProps: GetServerSideProps<ImportProps> =
    async ctx => {
        const url = ctx.query.url;
        if (typeof url !== "string") return {notFound: true};
        return {props: {url}};
    };
