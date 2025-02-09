import { Base } from "../base";
import type { Tool } from "../tools/base";
import type { FunctionToolCall, LLMResponse, ModelConfig } from "./llm.types";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type {
    ChatCompletionCreateParamsNonStreaming,
    ChatCompletionMessageParam,
    ChatCompletionTool,
} from "openai/resources/chat/completions";
import type { AnyZodObject } from "zod";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const entryToObject = ([key, value]: [string, AnyZodObject]) => {
    return z.object({ type: z.literal(key), value });
};

const responseAsStructuredOutput = (schema: Record<string, AnyZodObject>) => {
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

export class LLM extends Base {
    private model: ModelConfig;

    constructor(model: ModelConfig) {
        super("llm");
        this.model = model;
    }

    public async generate<T extends Record<string, AnyZodObject>>(
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
                config.baseURL =
                    "https://generativelanguage.googleapis.com/v1beta/openai";
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

        const mappedTemperature =
            this.model.temperature &&
            this.model.temperature > 0 &&
            this.model.temperature <= 2
                ? this.model.temperature
                : undefined;
        const requestConfig: ChatCompletionCreateParamsNonStreaming = {
            model: this.model.name,
            messages,
            tools: mappedTools.length > 0 ? mappedTools : undefined,
            temperature: mappedTemperature,
        };

        switch (provider) {
            case "GEMINI": {
                const [schemaKey, schemaValue] =
                    Object.entries(response_schema)[0] || [];
                if (!schemaKey || !schemaValue) {
                    throw new Error("Invalid response schema");
                }
                requestConfig.response_format = zodResponseFormat(
                    schemaValue,
                    schemaKey
                );
                break;
            }
            default: {
                requestConfig.response_format =
                    responseAsStructuredOutput(response_schema);
                break;
            }
        }

        const response =
            await client.beta.chat.completions.parse(requestConfig);

        if (response?.choices[0]?.message?.tool_calls?.length) {
            return {
                type: "tool_call",
                value: response.choices[0].message.tool_calls,
            } satisfies FunctionToolCall;
        }

        if (!response?.choices[0]?.message?.parsed) {
            throw new Error(JSON.stringify(response));
        }

        const parsed = response.choices[0]?.message?.parsed as {
            response: {
                type: keyof T;
                value: unknown;
            };
        };
        if (provider === "GEMINI") {
            if (!parsed) {
                throw new Error("No parsed response from Gemini");
            }

            return {
                type: Object.keys(response_schema)[0] as keyof T,
                value: parsed,
            } as LLMResponse<T>;
        }

        if (parsed?.response) {
            return parsed.response as LLMResponse<T>;
        }

        throw new Error("No response in message");
    }
}
