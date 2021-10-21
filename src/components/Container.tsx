import {Flex, Stack} from "@chakra-ui/react";
import Head from "next/head";
import {ReactNode} from "react";
import {NavBar} from "./NavBar";

export function Container({children}: {children: ReactNode}) {
    return (
        <Flex minHeight="100vh" justifyContent="center" p={12}>
            <Head>
                <title>Did Apple just ruin an almost perfect new MacBook Pro design?</title>
            </Head>
            <Stack maxWidth="1320px" width="full" direction="column">
                <NavBar />
                {children}
            </Stack>
        </Flex>
    );
}
