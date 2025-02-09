import type { ParsedFunctionToolCall } from "openai/resources/beta/chat/completions";
import type { AnyZodObject, z } from "zod";

export type OpenAIModel =
    | "gpt-4"
    | "gpt-4-turbo"
    | "gpt-3.5-turbo"
    | "gpt-4o"
    | "gpt-4o-mini"
    | "o3-mini";

export type OpenAIConfig = {
    provider: "OPEN_AI";
    name: OpenAIModel;
    toolChoice?: "auto" | "required";
    temperature?: number;
    apiKey?: string;
};

export type DeepSeekModel = "deepseek-chat" | "deepseek-coder";

export type DeepSeekConfig = {
    provider: "DEEPSEEK";
    name: DeepSeekModel;
    toolChoice?: "auto" | "required";
    temperature?: number;
    apiKey?: string;
};

export type GrokModel = "grok-2-latest" | "grok-beta";

export type GrokConfig = {
    provider: "GROK";
    name: GrokModel;
    toolChoice?: "auto" | "required";
    temperature?: number;
    apiKey?: string;
};

export type GeminiModel = "gemini-1.5-flash" | "gemini-1.5-pro";

export type GeminiConfig = {
    provider: "GEMINI";
    name: GeminiModel;
    toolChoice?: "auto" | "required";
    temperature?: number;
    apiKey?: string;
};

export type ModelConfig =
    | OpenAIConfig
    | DeepSeekConfig
    | GrokConfig
    | GeminiConfig;

export type LLMResponse<T extends Record<string, AnyZodObject>> = {
    [K in keyof T]: {
        type: K;
        value: z.infer<T[K]>;
    };
}[keyof T];

export type FunctionToolCall = {
    type: "tool_call";
    value: ParsedFunctionToolCall[];
};
