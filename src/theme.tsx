import "@fontsource/inter/variable.css";
import {extendTheme} from "@chakra-ui/react";
import {createBreakpoints} from "@chakra-ui/theme-tools";

const fonts = {
    heading: "InterVariable, sans-serif",
    body: "InterVariable, sans-serif"
};

const breakpoints = createBreakpoints({
    sm: "40em",
    md: "52em",
    lg: "64em",
    xl: "80em"
});

const config = {
    initialColorMode: "light",
    useSystemColorMode: true
};

const theme = extendTheme({
    fonts,
    breakpoints,
    config
});

export default theme;
