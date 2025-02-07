import { Agent } from "@covalenthq/ai-agent-sdk";

export const agent1 = new Agent({
	name: "Agent1",
	model: {
		provider: "OPEN_AI",
		name: "gpt-4o-mini",
	},
	description: "A helpful AI assistant that can engage in conversation.",
});

export const agent2 = new Agent({
	name: "Agent2",
	model: {
		provider: "OPEN_AI",
		name: "gpt-4o-mini",
	},
	description: "A helpful AI assistant that can engage in conversation.",
});
