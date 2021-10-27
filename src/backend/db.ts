import Knex from "knex";

const db = Knex({
    client: "pg",
    connection: {
        host: process.env.POSTGRES_HOST,
        port: parseInt(process.env.POSTGRES_PORT),
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB
    }
});

export default db;
