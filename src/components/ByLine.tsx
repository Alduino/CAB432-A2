import {chakra, HStack, Link, StackDivider, Text} from "@chakra-ui/react";
import {ReactElement, useMemo} from "react";
import TimeAgo from "react-timeago";

export interface ByLineProps {
    author: string;
    published: Date;
    link?: string;
}

export function ByLine({author, published, link}: ByLineProps): ReactElement {
    const linkHost = useMemo(() => link && new URL(link).hostname, [link]);

    return (
        <HStack divider={<StackDivider />}>
            <Text>
                <chakra.span opacity={0.6}>by </chakra.span>
                {author}
                {link && (
                    <>
                        <chakra.span opacity={.6}> on </chakra.span>
                        <Link target="_blank" href={link}>{linkHost}</Link>
                    </>
                )}
            </Text>
            <Text>
                <TimeAgo date={published} />
            </Text>
        </HStack>
    )
}
