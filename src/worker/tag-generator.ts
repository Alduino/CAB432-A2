import OpenAI from "openai-api";
import {
    addToInProgressTagDiscovery,
    createRedis,
    defaultRedis,
    dequeueArticlesForTagDiscovery,
    removeFromInProgressTagDiscovery,
    tagDiscoveryQueue
} from "../backend/redis";
import RedisRateLimiter from "../utils/RedisRateLimiter";
import {getMaybeCachedArticlesByIds} from "../utils/api/getMaybeCachedArticleById";
import createLogger from "../utils/createLogger";
import {addTagsToArticle} from "../utils/database";
import normaliseTag from "../utils/normaliseTag";

const logger = createLogger("worker:tag-generator");

const rateLimiter = new RedisRateLimiter(
    defaultRedis,
    "rate-limit:tag-generator",
    3
);

function buildPrompt(items: string[]) {
    return `This is a keyword generator.

Title: "How Discord Stores Billions of Messages"
Keywords: engineering, big-data, distributed-systems, discord

Title: "Spotify: A New Way to Listen"
Keywords: spotify, streaming-music

Title: "Design Patterns With Typescript Examples: Singleton"
Keywords: typescript, software-development, design-pattern

Article titles:
1. "How Discord Stores Billions of Messages"
2. "Spotify: A New Way to Listen"
3. "Design Patterns With Typescript Examples: Singleton"

Article keywords:
1. engineering, discord
2. spotify, streaming-music
3. typescript, design-pattern

Article titles:
${items.map((item, i) => `${i + 1}. ${JSON.stringify(item)}`).join("\n")}

Article keywords:
1.`;
}

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("Environment variable OPENAI_API_KEY is required");

const openai = new OpenAI(apiKey);

// rip $0.002
async function doTagGeneration(articles: string[]): Promise<string[]> {
    const success = await rateLimiter.trigger(articles.join(","));

    if (!success) {
        // timed out the rate limiter, do it later instead
        return articles;
    }

    if (articles.length !== 3) {
        logger.warn("Invalid amount of articles, expecting exactly three");
        return articles;
    }

    logger.info("Generating tags for articles", articles.length);

    const articleSources = await getMaybeCachedArticlesByIds(articles);

    const prompt = buildPrompt(articleSources.map(source => source.title));

    const response = await openai.complete({
        engine: "curie",
        prompt,
        maxTokens: 64,
        temperature: 0.2,
        topP: 1,
        presencePenalty: 0,
        frequencyPenalty: 0.2,
        bestOf: 1,
        n: 1,
        stream: false,
        stop: ["\n\n"]
    });

    const responseText = "1." + response.data.choices[0].text;

    const outputTags = responseText.split("\n").map(item =>
        item
            .replace(/^\d+\.\s+/, "")
            .split(",")
            .map(normaliseTag)
    );

    await removeFromInProgressTagDiscovery(articles);

    await Promise.all(
        articleSources.map(async (article, i) => {
            const tags = outputTags[i];

            if (tags) {
                await addTagsToArticle(
                    {...article, areExtraTagsLoading: false},
                    tags
                );
            } else {
                // add it back into the queue to do later
                await tagDiscoveryQueue.queue(article.id);
            }
        })
    );

    return [];
}

async function beginWorkerTagGeneration(abort?: AbortSignal) {
    const connection = createRedis();

    while (!(abort?.aborted ?? false)) {
        const articles = await dequeueArticlesForTagDiscovery(connection, 3);
        if (articles.length === 0) continue;
        const unsuccessful = await doTagGeneration(articles);
        await Promise.all(unsuccessful.map(id => tagDiscoveryQueue.queue(id)));
    }
}

export function beginTagGeneration(workerCount: number, abort?: AbortSignal) {
    logger.info("Beginning tag generation with %s workers", workerCount);

    for (let i = 0; i < workerCount; i++) {
        beginWorkerTagGeneration(abort);
    }
}
