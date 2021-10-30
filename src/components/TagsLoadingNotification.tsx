import {Center, Spinner, Tooltip} from "@chakra-ui/react";
import {ReactElement} from "react";

export function TagsLoadingNotification(): ReactElement {
    return (
        <Tooltip hasArrow label="Finding more tags" placement="right-end">
            <Center>
                <Spinner size="sm" />
            </Center>
        </Tooltip>
    );
}
