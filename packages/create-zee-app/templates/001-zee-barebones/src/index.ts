import { Agent, ZeeWorkflow } from "@covalenthq/ai-agent-sdk";
import "dotenv/config";

const agent1 = new Agent({
    name: "Agent1",
    model: {
        provider: "OPEN_AI",
        name: "gpt-4o-mini",
    },
    description: "A helpful AI assistant that can engage in conversation.",
});

const agent2 = new Agent({
    name: "Agent2",
    model: {
        provider: "OPEN_AI",
        name: "gpt-4o-mini",
    },
    description: "A helpful AI assistant that can engage in conversation.",
});

const zee = new ZeeWorkflow({
    description: "A workflow of agents that do stuff together",
    output: "Just bunch of stuff",
    agents: { agent1, agent2 },
});

(async function main() {
    const result = await ZeeWorkflow.run(zee);
    console.log(result);
})();
