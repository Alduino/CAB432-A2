import {chakra, HStack, Link, StackDivider, Text} from "@chakra-ui/react";
import {ReactElement, useMemo} from "react";
import TimeAgo from "react-timeago";

export interface ByLineProps {
    author: string;
    wasAuthorMatch?: boolean;
    published: Date;
    link?: string;
    wasLinkMatch?: boolean;
}

export function ByLine({
    author,
    wasAuthorMatch,
    published,
    link,
    wasLinkMatch
}: ByLineProps): ReactElement {
    const linkHost = useMemo(() => link && new URL(link).hostname, [link]);

    return (
        <HStack divider={<StackDivider />}>
            <Text>
                <chakra.span opacity={0.6}>by </chakra.span>
                {wasAuthorMatch ? <strong>{author}</strong> : author}
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
