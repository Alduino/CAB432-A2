![Artiller logo](./logo-small.png)

# Artiller

Artiller is a website that is designed to recommend online articles and blog posts. It allows users to search for articles based on a term, their tags, or a link, and, based on the article’s tags, author, an analysis of the source text, and the publishing date, recommends similar articles that the user might want to read. The website will also display an abridged version of the article so that users don’t have to go to the whole page if they don’t want to - similar to Reader Mode in browsers.

## Assignment Info

This project was created for the second assignment for CAB432 at QUT. Obviously, if you go to QUT and you are doing (or are going to do) CAB432, don’t look at this code.

## Technical Information

Artiller is written in React, and uses NextJS as its server. It stores its information in a Postgres database, and uses Redis as a cache and for task queues. Various APIs are used to query for data (which can be modified in `src/backend/sources`), and GPT3 is used to find tags for articles that don’t have any.

You can run it locally on your computer with `pnpm dev`, or build it for production with `pnpm build` then `pnpm start` to run it. If you don't want to run the background workers (which is ok, it is a completely separate application) you can run the `dev:app` or `start:app` scripts instead.

If you are running Artiller locally, there is a docker compose file provided (`development.compose.yml`) which will run Postgres and Redis instances. Redis is running on port 5437 without authentication, and Postgres uses port 5436 (db/user/pass: `artiller`/`artiller`/`dontlook`).

Before you run it, you need to initialise its database, by running `node initialise-database.mjs` with the database environment variables set. You only need to run this once.

Artiller expects some environment variables to be set when you run it, so it knows how to connect to its database and cache:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_HOST`, `POSTGRES_PORT`: Postgres connection details
- `REDIS_HOST`: Redis connection details (`hostname:port`)
- `OPENAI_API_KEY`: The API key to use to access GPT3

You can also set some optional environment variables:

- `LOG_LEVEL`: Sets the minimum level requried for a message to be logged. Defaults to `warn`. Must be a log level as specified by [pino](https://getpino.io/).
- `TAG_SEARCH_WORKER_COUNT`: The number of threads to run for mapping search tags to articles (i.e. how many searches it can perform at once)
- `WORD_SEARCH_WORKER_COUNT`: The number of threads to run for mapping search words to articles (i.e. how many searches it can perform at once)
- `TAG_GENERATION_WORKER_COUNT`: The number of threads to run for the GPT3 tag generation (i.e. how many articles it can find tags for at once)
