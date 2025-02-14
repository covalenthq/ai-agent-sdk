import type {
    GenerateTextParams,
    LLMTextResponse,
    ModelProvider,
} from "../llm";
import type { ToolSet } from "../tools";

export type AgentConfig = {
    name: string;
    model: ModelProvider;
    description: string;
    instructions?: string[];
    tools?: ToolSet;
    temperature?: number;
};

export type AgentGenerateParameters = Omit<
    GenerateTextParams,
    "prompt" | "tools" | "toolChoice"
>;

export type AgentResponse = LLMTextResponse;
