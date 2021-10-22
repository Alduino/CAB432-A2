import {SearchIcon} from "@chakra-ui/icons";
import {
    HStack,
    IconButton,
    Input,
    InputGroup,
    InputRightElement, StackProps,
    Tag,
    TagCloseButton,
    TagLabel,
    useMultiStyleConfig
} from "@chakra-ui/react";

export function SearchBox(props: StackProps) {
    const inputContainerStyles = useMultiStyleConfig("Input", {});

    return (
        <HStack
            spacing={0}
            sx={{
                ...inputContainerStyles.field,
                pl: 2,
                pr: 0,
                w: "lg"
            }}
            {...props}
        >
            <HStack>
                <Tag>
                    <TagLabel>apple</TagLabel>
                    <TagCloseButton />
                </Tag>
            </HStack>
            <InputGroup>
                <Input
                    flexGrow={1}
                    variant="unstyled"
                    pl={2}
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
    );
}
