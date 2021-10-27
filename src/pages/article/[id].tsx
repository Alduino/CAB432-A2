import {
    Box,
    Button,
    Heading,
    HStack,
    Link, LinkBox, LinkOverlay,
    Stack,
    StackDivider,
    Tag,
    Text, Wrap, WrapItem
} from "@chakra-ui/react";
import {GetServerSideProps} from "next";
import NextLink from "next/link";
import {useRouter} from "next/router";
import {useCallback} from "react";
import {isApiError} from "../../api-types/ApiError";
import ArticleType from "../../api-types/Article";
import {getArticleResult} from "../../backend/article";
import {ByLine} from "../../components/ByLine";
import {Container} from "../../components/Container";
import {MainStack} from "../../components/MainStack";
import {getMockedArticleResult} from "../../utils/api-mock";
import shouldMock from "../../utils/shouldMock";

interface ArticleProps {
    article: ArticleType;
}

export default function Article({article}: ArticleProps) {
    const {push} = useRouter();

    const findSimilarArticles = useCallback(() => {
        push(
            `/search?tags=${article.tags.map(t => `normal_${encodeURIComponent(t)}`).join(",")},author_${encodeURIComponent(article.author)}`,
            "/search"
        );
    }, [push, article.tags, article.author]);

    return (
        <Container title={`${article.title} - Artiller`}>
            <MainStack>
                <Stack height="full" direction="row" divider={<StackDivider />}>
                    <Stack flexGrow={1} p={8} spacing={4}>
                        <Heading size="md">{article.title}</Heading>
                        <ByLine
                            author={article.author}
                            published={new Date(article.published)}
                            linkToSearch
                        />
                        <Wrap>
                            {article.tags.map(tag => (
                                <WrapItem key={tag}>
                                    <LinkBox>
                                        <Tag>
                                            <NextLink href={`/search?tags=normal_${encodeURIComponent(tag)}`} as="/search" passHref>
                                                <LinkOverlay>
                                                    {tag}
                                                </LinkOverlay>
                                            </NextLink>
                                        </Tag>
                                    </LinkBox>
                                </WrapItem>
                            ))}
                        </Wrap>
                        <Box />
                        <HStack>
                            <Button
                                variant="outline"
                                colorScheme="gray"
                                onClick={findSimilarArticles}
                            >
                                Find similar articles
                            </Button>
                        </HStack>
                        <Box flexGrow={1} />
                        <HStack spacing={1} fontSize="sm" opacity={0.8}>
                            <Text opacity={0.8}>
                                Something broken? Read this article on
                            </Text>
                            <Link target="_blank" href={article.link}>
                                {new URL(article.link).host}
                            </Link>
                        </HStack>
                    </Stack>
                    <Stack w="62%" p={12} spacing={4}>
                        {article.paragraphs.map((p, i) => (
                            <Text key={i}>{p}</Text>
                        ))}
                    </Stack>
                </Stack>
            </MainStack>
        </Container>
    );
}

export const getServerSideProps: GetServerSideProps<
    ArticleProps,
    {id: string}
> = async ctx => {
    const result = shouldMock() ? getMockedArticleResult(ctx.params) : await getArticleResult(ctx.params);

    if (isApiError(result)) {
        return {
            notFound: true
        };
    }

    return {
        props: {
            article: result
        }
    };
};
