import type { Agent } from ".";
import type { ZeeWorkflowState } from "../state";
import type { ToolSet } from "ai";

export type AgentConfig = {
    name: string;
    // model: ModelConfig;

    description: string;
    instructions?: string[];

    tools?: ToolSet;
    runFn?: (
        agent: Agent,
        state: ZeeWorkflowState
    ) => Promise<ZeeWorkflowState>;
};

export type AgentName = string;
