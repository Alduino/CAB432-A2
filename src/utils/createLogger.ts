import {pino} from "pino";

export default function createLogger(name: string) {
    return pino({name, level: process.env.LOG_LEVEL ?? "warn"});
}
