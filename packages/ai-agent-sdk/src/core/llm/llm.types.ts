import type { ToolSet } from "../tools";
import type { generateObject, generateText } from "ai";
import type { AnyZodObject, z } from "zod";

export type OpenAIModelId =
    | "gpt-4o"
    | "gpt-4o-mini"
    | "gpt-4o-2024-05-13"
    | "gpt-4o-2024-08-06"
    | "gpt-4o-2024-11-20"
    | "gpt-4o-audio-preview"
    | "gpt-4o-audio-preview-2024-10-01"
    | "gpt-4o-audio-preview-2024-12-17"
    | "gpt-4o-mini-2024-07-18"
    | "gpt-4-turbo"
    | "gpt-4-turbo-2024-04-09"
    | "gpt-4-turbo-preview"
    | "gpt-4-0125-preview"
    | "gpt-4-1106-preview"
    | "gpt-4"
    | "gpt-4-0613"
    | "gpt-3.5-turbo-0125"
    | "gpt-3.5-turbo"
    | "gpt-3.5-turbo-1106";
export interface OpenAIModelProvider {
    provider: "openai";
    id: OpenAIModelId;
}

export type AnthropicModelId =
    | "claude-3-5-sonnet-latest"
    | "claude-3-5-sonnet-20241022"
    | "claude-3-5-sonnet-20240620"
    | "claude-3-5-haiku-latest"
    | "claude-3-5-haiku-20241022"
    | "claude-3-opus-latest"
    | "claude-3-opus-20240229"
    | "claude-3-sonnet-20240229"
    | "claude-3-haiku-20240307";
export interface AnthropicModelProvider {
    provider: "anthropic";
    id: AnthropicModelId;
}

export type GoogleModelId =
    | "gemini-2.0-flash-001"
    | "gemini-1.5-flash"
    | "gemini-1.5-flash-latest"
    | "gemini-1.5-flash-001"
    | "gemini-1.5-flash-002"
    | "gemini-1.5-flash-8b"
    | "gemini-1.5-flash-8b-latest"
    | "gemini-1.5-flash-8b-001"
    | "gemini-1.5-pro"
    | "gemini-1.5-pro-latest"
    | "gemini-1.5-pro-001"
    | "gemini-1.5-pro-002"
    | "gemini-2.0-flash-lite-preview-02-05"
    | "gemini-2.0-pro-exp-02-05"
    | "gemini-2.0-flash-thinking-exp-01-21"
    | "gemini-2.0-flash-exp"
    | "gemini-exp-1206"
    | "learnlm-1.5-pro-experimental";
export interface GoogleModelProvider {
    provider: "google";
    id: GoogleModelId;
}

export type ModelProvider =
    | OpenAIModelProvider
    | AnthropicModelProvider
    | GoogleModelProvider;

export type GenerateTextParams = Omit<
    Parameters<typeof generateText>[0],
    "model" | "tools"
> & {
    tools?: ToolSet;
};

export type GenerateObjectParams = Omit<
    Parameters<typeof generateObject>[0],
    "model" | "schema" | "tools" | "toolChoice"
> & {
    schema: AnyZodObject;
};

export type LLMParameters = GenerateTextParams | GenerateObjectParams;

export interface LLMStructuredResponse<T extends AnyZodObject> {
    type: "assistant";
    value: z.infer<T>;
}

export interface LLMTextResponse {
    type: "assistant";
    value: string;
}

export type LLMResponse<T extends AnyZodObject> =
    | LLMStructuredResponse<T>
    | LLMTextResponse;
