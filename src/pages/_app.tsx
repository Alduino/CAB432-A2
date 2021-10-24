import {ChakraProvider} from "@chakra-ui/react";
import {AppProps} from "next/app";
import {useEffect, useState} from "react";
import {ApiProvider} from "../hooks/api-client";
import theme from "../theme";

function MyApp({Component, pageProps}: AppProps) {
    const [apiBaseUrl, setApiBaseUrl] = useState("http://temporary/");

    useEffect(() => {
        setApiBaseUrl(new URL("/api/", `${location.protocol}//${location.host}`).toString());
    }, []);

    return (
        <ChakraProvider resetCSS theme={theme}>
            <ApiProvider baseUrl={apiBaseUrl}>
                <Component {...pageProps} />
            </ApiProvider>
        </ChakraProvider>
    );
}

export default MyApp;
