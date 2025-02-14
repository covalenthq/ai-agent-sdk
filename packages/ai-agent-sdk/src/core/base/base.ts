import "dotenv/config";
import pino from "pino";

export const logger = pino({
    level: "debug",
});

export type MODULE = "agent" | "llm" | "tools" | "server" | "zee";

export class Base {
    private logger: pino.Logger;
    private module: MODULE;

    constructor(module: MODULE) {
        this.logger = logger;
        this.module = module;
    }

    // TODO: setup logger for different levels
    info(message: string, ...args: unknown[]) {
        // this.logger.info(`[${this.module}] ${message}`, ...args);
        console.log(`[${this.module}] ${message}`, ...args);
    }
}
