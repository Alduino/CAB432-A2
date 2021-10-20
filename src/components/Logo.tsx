import {chakra, useColorModeValue} from "@chakra-ui/react";

const Svg = chakra.svg;

const logoPath = "m49.9 15c-19.4 0-31.6 8.26-37.5 17-5.85 8.75-5.96 17.9-5.96 17.9l17.4 0.266s0.089-4.03 3.02-8.42c2.93-4.39 8.05-9.26 23-9.26 16.2 0 21.1 4.94 23.7 9.04 3.4 5.51 2.83 12.8 0.322 17.1-2.4 3.96-7.24 8.94-24 8.94v17.4c20.8 0 33.4-8.16 38.9-17.3 7.12-12.5 5.31-25.9-0.453-35.4-5.65-9.04-18.1-17.2-38.5-17.2zm-26 61.3c0 4.82-3.9 8.72-8.72 8.72-4.81 0-8.72-3.91-8.72-8.72 1e-7 -4.82 3.9-8.72 8.72-8.72 4.81 0 8.72 3.91 8.72 8.72z";

export interface LogoProps {
    /**
     * The size that the logo will be displayed at
     */
    size: string | number;

    /**
     * The colour to fill the logo width. Defaults to black in the light theme,
     * and white in the dark theme.
     */
    fill?: string;
}

export function Logo({size, fill}: LogoProps) {
    const defaultFillColour = useColorModeValue("gray.800", "whiteAlpha.900");
    const fillColour = fill ?? defaultFillColour;

    return (
        <Svg w={size} h={size} fill={fillColour} viewBox="0 0 100 100">
            <path d={logoPath} />
        </Svg>
    );
}
