import type { Agent } from "../agent";
import type { ModelProvider } from "../llm";

export type ZeeWorkflowOptions = {
    goal: string;
    agents: Record<string, Agent>;
    maxIterations?: number;
    model: ModelProvider;
};

export type ZEEDefaultAgents = "router" | "resourcePlanner" | "endgame";

export interface AgentAction {
    type: "request" | "complete" | "followup" | "response";
    from: string;
    to: string;
    content: string;
    metadata?: {
        dependencies?: Record<string, string>;
        isTaskComplete?: boolean;
    };
}

export interface ContextItem {
    role: string;
    content: unknown;
}

export interface ZEEWorkflowResponse {
    content: string;
    context: ContextItem[];
}
