import {SearchIcon} from "@chakra-ui/icons";
import {
    Box,
    Center,
    Heading,
    HStack,
    IconButton,
    Input,
    InputGroup,
    InputRightElement,
    Tag,
    TagCloseButton,
    TagLabel,
    useMultiStyleConfig,
    VStack
} from "@chakra-ui/react";
import {ReactElement} from "react";
import {Container} from "../components/Container";
import {Logo} from "../components/Logo";

export default function Index(): ReactElement {
    const inputContainerStyles = useMultiStyleConfig("Input", {});

    return (
        <Container title="Artiller">
            <Center flexDir="column">
                <VStack spacing={6}>
                    <Logo size={16} />
                    <Heading size="md">Artiller</Heading>
                    <HStack
                        sx={{
                            ...inputContainerStyles.field,
                            pl: 2,
                            pr: 0,
                            w: "lg"
                        }}
                    >
                        <HStack>
                            <Tag>
                                <TagLabel>apple</TagLabel>
                                <TagCloseButton />
                            </Tag>
                        </HStack>
                        <InputGroup overflow="hidden">
                            <Input
                                flexGrow={1}
                                variant="unstyled"
                                py={2}
                                type="search"
                                defaultValue="macbook 2021"
                                placeholder="Search or paste a URL"
                            />
                            <InputRightElement
                                as={IconButton}
                                aria-label="Search"
                                variant="ghost"
                                color="gray.500"
                                icon={<SearchIcon />}
                            />
                        </InputGroup>
                    </HStack>
                </VStack>
                <Box h="30vh" />
            </Center>
        </Container>
    );
}
