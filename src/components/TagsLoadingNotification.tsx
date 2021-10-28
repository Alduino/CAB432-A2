import {ReactElement} from "react";
import {Center, Spinner, Tooltip} from "@chakra-ui/react";

export function TagsLoadingNotification(): ReactElement {
    return (
        <Tooltip hasArrow label="Finding more tags">
            <Center>
                <Spinner size="sm" />
            </Center>
        </Tooltip>
    );
}
