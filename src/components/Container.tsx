import {Flex, Stack} from "@chakra-ui/react";
import {ReactNode} from "react";
import {NavBar} from "./NavBar";

export function Container({children}: {children: ReactNode}) {
    return (
        <Flex justifyContent="center" p={12}>
            <Stack maxWidth="1320px" width="full" direction="column">
                <NavBar />
                {children}
            </Stack>
        </Flex>
    );
}
