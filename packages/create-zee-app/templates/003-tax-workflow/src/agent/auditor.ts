import { Agent } from "@covalenthq/ai-agent-sdk";

export const getAuditor = (tools: Record<string, any>) => {
    return new Agent({
        name: "Auditor",
        model: {
            provider: "OPEN_AI",
            name: "gpt-4o-mini",
        },
        description:
            "Reviews and validates tax calculations and ensures compliance",
        instructions: [
            "Review all tax calculations for accuracy",
            "Verify transaction categorizations",
            "Check for compliance with tax regulations",
            "Flag any suspicious or unusual patterns",
            "Provide final verification of tax report",
        ],
        tools,
    });
};
