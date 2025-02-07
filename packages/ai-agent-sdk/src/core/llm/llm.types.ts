import type { AnyZodObject, Schema, z } from "zod";

export type ModelProvider =
    | "openai"
    | "anthropic"
    | "google"
    | "mistral"
    | "aws"
    | "azure";

export type ModelConfig = {
    provider: ModelProvider;
    name: string;
    temperature?: number;
    apiKey?: string;
};

export type LLMResponse<T extends Record<string, AnyZodObject>> = {
    [K in keyof T]: {
        type: K;
        value: z.infer<T[K]>;
    };
}[keyof T];

export type FunctionToolCall = {
    type: "tool_call";
    value: Array<{
        id: string;
        type: "function";
        function: {
            name: string;
            arguments: string;
        };
    }>;
};

export type AnyZodSchema<T> = z.Schema<T, z.ZodTypeDef, unknown> | Schema<T>;
