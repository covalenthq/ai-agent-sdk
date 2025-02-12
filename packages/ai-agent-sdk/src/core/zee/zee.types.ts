import type { Agent } from "../agent";
import type { ModelProvider } from "../llm";

export type ZeeWorkflowOptions = {
    description: string;
    output: string;
    agents: Record<string, Agent>;
    // maxIterations?: number;
    model: ModelProvider;
};

export type ZEEDefaultAgents = "router" | "resourcePlanner" | "endgame";
