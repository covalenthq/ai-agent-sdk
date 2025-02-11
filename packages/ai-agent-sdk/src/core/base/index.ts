import type {
    CoreAssistantMessage,
    CoreSystemMessage,
    CoreUserMessage,
} from "ai";
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

    info(message: string, ...args: unknown[]) {
        // this.logger.info(`[${this.module}] ${message}`, ...args);
        console.log(`[${this.module}] ${message}`, ...args);
    }

    public static user(content: string): CoreUserMessage {
        return {
            role: "user",
            content,
        };
    }

    public static assistant(content: string): CoreAssistantMessage {
        return {
            role: "assistant",
            content,
        };
    }

    public static system(content: string): CoreSystemMessage {
        return {
            role: "system",
            content,
        };
    }
}
