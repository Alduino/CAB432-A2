import {chakra, HStack, Link, Stack, StackDivider, Text, useBreakpointValue} from "@chakra-ui/react";
import NextLink from "next/link";
import {ReactElement, useMemo} from "react";
import TimeAgo from "react-timeago";

export interface ByLineProps {
    author: string;
    wasAuthorMatch?: boolean;
    published: Date;
    link?: string;
    wasLinkMatch?: boolean;
    linkToSearch?: boolean;
}

export function ByLine({
    author,
    wasAuthorMatch,
    published,
    link,
    wasLinkMatch,
    linkToSearch
}: ByLineProps): ReactElement {
    const useStackDivider = useBreakpointValue([false, null, true]);
    const linkHost = useMemo(() => link && new URL(link).hostname, [link]);

    const authorText = wasAuthorMatch ? <strong>{author}</strong> : author;

    return (
        <Stack direction={["column", null, "row"]} divider={useStackDivider && <StackDivider />} spacing={[0, null, 2]}>
            <Text>
                <chakra.span opacity={0.6}>by </chakra.span>
                {linkToSearch ? (
                    <NextLink href={`/search?tags=author_${author}`} as="/search" passHref><Link>{authorText}</Link></NextLink>
                ) : authorText}
                {link && (
                    <>
                        <chakra.span opacity={0.6}> on </chakra.span>
                        <Link
                            target="_blank"
                            href={link}
                            fontWeight={wasLinkMatch ? "bold" : "normal"}
                        >
                            {linkHost}
                        </Link>
                    </>
                )}
            </Text>
            <Text fontSize={["sm", null, "md"]} opacity={[.8, null, 1]}>
                <TimeAgo date={published} />
            </Text>
        </Stack>
    );
}
