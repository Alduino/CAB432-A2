import {Box, Heading, HStack} from "@chakra-ui/react";
import {ReactElement} from "react";
import {Logo} from "./Logo";
import {QutLogo} from "./QutLogo";

export function NavBar(): ReactElement {
    return (
        <HStack width="full" align="center" pr={12} pl={8} py={1}>
            <Logo size={8} />
            <Heading size="sm">Artiller</Heading>
            <Box flexGrow={1} />
            <QutLogo height={8} />
        </HStack>
    );
}
