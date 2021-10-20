import {chakra, HStack, StackDivider, Text} from "@chakra-ui/react";
import {ReactElement} from "react";
import TimeAgo from "react-timeago";

export interface ByLineProps {
    author: string;
    published: Date;
}

export function ByLine({author, published}: ByLineProps): ReactElement {
    return (
        <HStack divider={<StackDivider />}>
            <Text>
                <chakra.span opacity={0.6}>by </chakra.span>
                {author}
            </Text>
            <Text>
                <TimeAgo date={published} />
            </Text>
        </HStack>
    )
}
