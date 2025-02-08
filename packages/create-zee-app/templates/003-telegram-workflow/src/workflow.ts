import { agent1, agent2 } from "./agents";
import { ZeeWorkflow } from "@covalenthq/ai-agent-sdk";

export const startWorkflow = () =>
    new ZeeWorkflow({
        description: "A workflow of agents that do stuff together",
        output: "Just bunch of stuff",
        agents: { agent1, agent2 },
    });
