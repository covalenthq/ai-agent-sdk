import { Agent } from "@covalenthq/ai-agent-sdk";

export const getAccountant = (tools: Record<string, any>) => {
    return new Agent({
        name: "Accountant",
        model: {
            provider: "OPEN_AI",
            name: "gpt-4o-mini",
        },
        description:
            "Processes transaction data and calculates tax implications",
        instructions: [
            "Review categorized transactions",
            "Calculate taxable income from different sources",
            "Apply appropriate tax rates based on categories",
            "Calculate capital gains/losses from trades",
            "Generate preliminary tax calculations",
        ],
        tools,
    });
};
