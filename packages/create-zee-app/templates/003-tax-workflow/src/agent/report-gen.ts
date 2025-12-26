import { Agent } from "@covalenthq/ai-agent-sdk";

export const getReportGen = (tools: Record<string, any>) => {
    return new Agent({
        name: "ReportGenerator",
        model: {
            provider: "OPEN_AI",
            name: "gpt-4o-mini",
        },
        description:
            "Generates comprehensive tax reports with detailed calculations",
        instructions: [
            "Compile all analyzed data into a structured report",
            "Include breakdown of income by category",
            "Calculate total taxable income and tax due for each category",
            "Detail capital gains/losses with tax implications",
            "Summarize total tax obligations with clear breakdown",
            "Generate recommendations for tax optimization",
            "Include estimated quarterly tax payments if applicable",
            "Provide final tax amount due with detailed calculations",
        ],
        tools,
    });
};
