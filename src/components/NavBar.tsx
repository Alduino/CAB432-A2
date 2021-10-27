import {Box, Heading, HStack, Link} from "@chakra-ui/react";
import NextLink from "next/link";
import {ReactElement} from "react";
import {Logo} from "./Logo";
import {QutLogo} from "./QutLogo";

export function NavBar(): ReactElement {
    return (
        <HStack width="full" align="center" pr={12} pl={8} py={1}>
            <Logo size={8} />
            <Heading size="sm">
                <NextLink href="/" passHref>
                    <Link>Artiller</Link>
                </NextLink>
            </Heading>
            <Box flexGrow={1} />
            <QutLogo height={8} />
        </HStack>
    );
}
