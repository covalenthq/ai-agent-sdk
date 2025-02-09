import type { Agent } from "../agent";

export type ZeeWorkflowOptions = {
    description: string;
    output: string;
    agents: Record<string, Agent>;
    maxIterations?: number;
};
