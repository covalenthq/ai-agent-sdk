import { Agent } from "@covalenthq/ai-agent-sdk";

export const getTransactionAnalyzer = (tools: Record<string, any>) => {
    return new Agent({
        name: "TransactionAnalyzer",
        model: {
            provider: "OPEN_AI",
            name: "gpt-4o-mini",
        },
        description:
            "Analyzes wallet transactions and categorizes them for tax purposes using the taxCategory tool",
        instructions: [
            "Fetch and analyze all transactions for the given wallet",
            "Identify transaction types (transfers, swaps, etc.)",
            "Calculate total transaction volumes",
            "Flag potential taxable events",
        ],
        tools,
    });
};
