import { Base } from "../base";
import type { Tool } from "../tools/base";
import type {
    FunctionToolCall,
    LLMResponse,
    ModelConfig,
    OllamaResponse,
    FormattedResponse,
} from "./llm.types";
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
            case "OLLAMA": {
                config.baseURL =
                    process.env["OLLAMA_BASE_URL"] ||
                    this.model.baseURL ||
                    "http://localhost:11434";

                try {
                    const response = await fetch(`${config.baseURL}/api/chat`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            model: this.model.name,
                            messages: messages.map((msg) => ({
                                role: msg.role,
                                content:
                                    typeof msg.content === "string"
                                        ? msg.content
                                        : "",
                            })),
                            stream: true,
                        }),
                    });

                    if (!response.ok || !response.body) {
                        throw new Error(
                            `Ollama API error: ${response.statusText}`
                        );
                    }

                    const reader = response.body.getReader();
                    let fullContent = "";

                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;

                            const chunk = new TextDecoder().decode(value);
                            const lines = chunk.split("\n");

                            for (const line of lines) {
                                if (line.trim()) {
                                    try {
                                        const json = JSON.parse(
                                            line
                                        ) as OllamaResponse;
                                        if (json.message?.content) {
                                            fullContent += json.message.content;
                                        }
                                    } catch (e) {
                                        // ignore parse errors
                                    }
                                }
                            }
                        }
                    } finally {
                        reader.releaseLock();
                    }

                    const formatResponse = (
                        content: string
                    ): FormattedResponse => {
                        const parts = content.split("</think>");
                        const thinking =
                            parts.length > 1 && parts[0]
                                ? parts[0].replace("<think>", "").trim()
                                : "";
                        const response =
                            parts.length > 1
                                ? parts[1]?.trim() || content.trim()
                                : content.trim();

                        return { thinking, response };
                    };

                    const formattedContent = formatResponse(fullContent);

                    return {
                        type: "content" as keyof T,
                        value: {
                            result: {
                                role: "assistant",
                                content: {
                                    thinking: formattedContent.thinking,
                                    answer: formattedContent.response,
                                },
                            },
                            status: "finished",
                            children: [],
                        },
                    } as LLMResponse<T>;
                } catch (error) {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : "Unknown error";
                    throw new Error(`Ollama API error: ${errorMessage}`);
                }
            }
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
