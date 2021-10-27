import Knex from "knex";
import {config as loadEnv} from "dotenv";

loadEnv();

const knex = Knex({
    client: "pg",
    connection: {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB
    }
});

console.log("Installing the citext extension");
await knex.raw("create extension if not exists \"citext\"");

console.log("Initialising the database schema");

await knex.schema.createTable("articles", table => {
    table.uuid("id").primary();
    table.text("source_id").unique();
    table.specificType("title", "citext").notNullable();
    table.specificType("author", "citext").index().notNullable();
    table.text("link").notNullable();
    table.specificType("link_domain", "citext").index().notNullable();
    table.dateTime("published").defaultTo(knex.fn.now()).notNullable();
    table.specificType("paragraphs", "text ARRAY").notNullable();
});

await knex.schema.createTable("article_tags", table => {
    table.uuid("id").primary();
    table.uuid("article_id").references("id").inTable("articles").notNullable();
    table.text("name").index().notNullable();
});

console.log("Done");
process.exit();
