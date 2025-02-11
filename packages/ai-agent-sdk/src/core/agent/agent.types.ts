import type {
    GenerateTextParams,
    LLMTextResponse,
    ModelProvider,
} from "../llm";
import type { ToolSet } from "ai";

export type AgentConfig = {
    name: string;
    model: ModelProvider;
    description: string;
    instructions?: string[];
    tools?: ToolSet;
};

export type AgentParameters = Omit<GenerateTextParams, "prompt">;

export type AgentResponse = LLMTextResponse;
