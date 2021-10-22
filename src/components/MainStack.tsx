import {Stack} from "@chakra-ui/react";
import {ReactElement, ReactNode} from "react";
import {NavBar} from "./NavBar";

export interface MainStackProps {
    children: ReactNode;
}

export function MainStack({children}: MainStackProps): ReactElement {
    return (
        <Stack maxWidth="1320px" width="full" direction="column">
            <NavBar />
            {children}
        </Stack>
    );
}
