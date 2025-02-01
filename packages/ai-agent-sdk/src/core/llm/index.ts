import { Base } from "../base";
import type { Tool } from "../tools/base";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { ParsedFunctionToolCall } from "openai/resources/beta/chat/completions";
import type {
    ChatCompletionMessageParam,
    ChatCompletionTool,
} from "openai/resources/chat/completions";
// import { zodToJsonSchema } from "openai/src/_vendor/zod-to-json-schema/index.js";
import type { ZodObject } from "zod";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export type OpenAIModel =
    | "gpt-4"
    | "gpt-4-turbo"
    | "gpt-3.5-turbo"
    | "gpt-4o"
    | "gpt-4o-mini"
    | "o3-mini";

type OpenAIConfig = {
    provider: "OPEN_AI";
    name: OpenAIModel;
    toolChoice?: "auto" | "required";
    apiKey?: string;
};

export type DeepSeekModel = "deepseek-chat" | "deepseek-coder";

type DeepSeekConfig = {
    provider: "DEEPSEEK";
    name: DeepSeekModel;
    toolChoice?: "auto" | "required";
    apiKey?: string;
};

export type GrokModel = "grok-2-latest" | "grok-beta";

type GrokConfig = {
    provider: "GROK";
    name: GrokModel;
    toolChoice?: "auto" | "required";
    apiKey?: string;
};

export type GeminiModel = "gemini-1.5-flash" | "gemini-1.5-pro";

type GeminiConfig = {
    provider: "GEMINI";
    name: GeminiModel;
    toolChoice?: "auto" | "required";
    apiKey?: string;
};

export type ModelConfig =
    | OpenAIConfig
    | DeepSeekConfig
    | GrokConfig
    | GeminiConfig;

const entryToObject = ([key, value]: [string, ZodObject<any>]) => {
    return z.object({ type: z.literal(key), value });
};

const responseAsStructuredOutput = (schema: Record<string, any>) => {
    const [first, ...rest] = Object.entries(schema);
    if (!first) {
        throw new Error("No schema provided");
    }

    return zodResponseFormat(
        z.object({
            response: z.discriminatedUnion("type", [
                entryToObject(first),
                ...rest.map(entryToObject),
            ]),
        }),
        "task_result"
    );
};

const formatOpenAITools = (
    tools: Record<string, Tool>
): Array<ChatCompletionTool> => {
    return Object.entries(tools).map(([name, tool]) => ({
        type: "function",
        function: {
            name,
            parameters: zodToJsonSchema(tool.schema),
            description: tool.description,
            strict: true,
        },
    }));
};

type LLMResponse<T extends Record<string, z.ZodObject<any>>> = {
    [K in keyof T]: {
        type: K;
        value: z.infer<T[K]>;
    };
}[keyof T];

type FunctionToolCall = {
    type: "tool_call";
    value: ParsedFunctionToolCall[];
};

export class LLM extends Base {
    private model: ModelConfig;

    constructor(model: ModelConfig) {
        super("llm");
        this.model = model;
    }

    public async generate<T extends Record<string, z.ZodObject<any>>>(
        messages: ChatCompletionMessageParam[],
        response_schema: T,
        tools: Record<string, Tool>
    ): Promise<FunctionToolCall | LLMResponse<T>> {
        const config: ConstructorParameters<typeof OpenAI>[0] = {
            apiKey: this.model.apiKey,
        };
        const provider = this.model.provider;
        switch (provider) {
            case "OPEN_AI":
                break;
            case "DEEPSEEK":
                config.baseURL = "https://api.deepseek.com/v1";
                config.apiKey =
                    process.env["DEEPSEEK_API_KEY"] || this.model.apiKey;
                break;
            case "GROK":
                config.baseURL = "https://api.groq.com/openai/v1";
                config.apiKey =
                    process.env["GROK_API_KEY"] || this.model.apiKey;
                break;
            case "GEMINI":
                config.baseURL = "https://api.gemini.google.com/v1";
                config.apiKey =
                    process.env["GEMINI_API_KEY"] || this.model.apiKey;
                break;
            default:
                var _exhaustiveCheck: never = provider;
                throw new Error(
                    `Unhandled model provider: ${_exhaustiveCheck}`
                );
        }
        const client = new OpenAI(config);

        const mappedTools = tools ? formatOpenAITools(tools) : [];

        const response = await client.beta.chat.completions.parse({
            model: this.model.name,
            messages,
            response_format: responseAsStructuredOutput(response_schema),
            tools: mappedTools.length > 0 ? mappedTools : undefined,
        });

        const message = response.choices[0] && response.choices[0].message;

        if (message && message.tool_calls && message.tool_calls.length > 0) {
            return {
                type: "tool_call",
                value: message.tool_calls,
            } satisfies FunctionToolCall;
        }

        if (message?.parsed?.response) {
            return message.parsed.response as LLMResponse<T>;
        }

        throw new Error("No response in message");
    }
}
