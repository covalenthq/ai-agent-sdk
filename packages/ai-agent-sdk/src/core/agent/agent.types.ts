import type { Agent } from ".";
import type { ModelConfig } from "../llm";
import type { ZeeWorkflowState } from "../state";
import type { Tool } from "../tools/base";

export type AgentConfig = {
    name: string;
    model: ModelConfig;

    description: string;
    instructions?: string[];

    tools?: Record<AgentName, Tool>;
    runFn?: (
        agent: Agent,
        state: ZeeWorkflowState
    ) => Promise<ZeeWorkflowState>;
};

export type AgentName = string;
