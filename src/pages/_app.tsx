import {ChakraProvider} from "@chakra-ui/react";
import {AppProps} from "next/app";
import {ApiProvider} from "../hooks/api-client";
import theme from "../theme";

function MyApp({Component, pageProps}: AppProps) {
    const apiBaseUrl =
        typeof window === "undefined"
            ? "http://example.com/api/"
            : `${location.protocol}//${location.host}/api/`;

    return (
        <ChakraProvider resetCSS theme={theme}>
            <ApiProvider baseUrl={apiBaseUrl}>
                <Component {...pageProps} />
            </ApiProvider>
        </ChakraProvider>
    );
}

export default MyApp;
