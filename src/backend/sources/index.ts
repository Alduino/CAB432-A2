import Source from "./Source";
import mediumSource from "./medium";

type SourceMapping<Options extends Source<string, unknown>> = {
    [Name in Options["id"]]: Options & {id: Name};
};

function buildSources<Options extends Source<string, unknown>[]>(
    ...options: Options
) {
    return Object.fromEntries(
        options.map(opt => [opt.id, opt])
    ) as SourceMapping<Options[number]>;
}

export const sources = buildSources(mediumSource);
