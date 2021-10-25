import {chakra, HStack, Link, StackDivider, Text} from "@chakra-ui/react";
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
    const linkHost = useMemo(() => link && new URL(link).hostname, [link]);

    const authorText = wasAuthorMatch ? <strong>{author}</strong> : author;

    return (
        <HStack divider={<StackDivider />}>
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
            <Text>
                <TimeAgo date={published} />
            </Text>
        </HStack>
    );
}
