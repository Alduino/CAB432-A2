import {Flex, useColorModeValue} from "@chakra-ui/react";
import Head from "next/head";
import {ReactNode} from "react";

export interface ContainerProps {
    title: string;
    children: ReactNode;
}

export function Container({title, children}: ContainerProps) {
    const faviconPath = useColorModeValue(
        "/assets/logo-black.svg",
        "/assets/logo-white.svg"
    );

    return (
        <Flex minHeight="100vh" justifyContent="center" p={[4, null, 12]}>
            <Head>
                <title>{title}</title>
                <link rel="icon" href={faviconPath} />
            </Head>
            {children}
        </Flex>
    );
}
