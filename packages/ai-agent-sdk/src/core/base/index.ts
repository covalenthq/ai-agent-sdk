import "dotenv/config";
import type {
    ChatCompletionAssistantMessageParam,
    ChatCompletionMessageParam,
    ChatCompletionSystemMessageParam,
    ChatCompletionUserMessageParam,
} from "openai/resources/chat/completions";
import pino from "pino";
import { type ZodType } from "zod";

export const logger = pino({
    level: "debug",
});

export type MODULE = "agent" | "llm" | "tools" | "server" | "zee";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyZodType = ZodType<any>;

export class Base {
    private logger: pino.Logger;
    private module: MODULE;

    constructor(module: MODULE) {
        this.logger = logger;
        this.module = module;
    }

    info(message: string, ...args: any[]) {
        // this.logger.info(`[${this.module}] ${message}`, ...args);
        console.log(`[${this.module}] ${message}`, ...args);
    }
}

export const user = (content: string): ChatCompletionUserMessageParam => ({
    role: "user",
    content,
});

export const assistant = (
    content: string
): ChatCompletionAssistantMessageParam => ({
    role: "assistant",
    content,
});

export const system = (content: string): ChatCompletionSystemMessageParam => ({
    role: "system",
    content,
});

export type Conversation = [
    ChatCompletionUserMessageParam,
    ...ChatCompletionMessageParam[],
];
