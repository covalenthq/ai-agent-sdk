import {
    Agent,
    type ModelProvider,
    Tool,
    ZeeWorkflow,
} from "@covalenthq/ai-agent-sdk";
import "dotenv/config";
import { z } from "zod";

const model: ModelProvider = {
    provider: "openai",
    id: "gpt-4o-mini",
};

const fetchNews = new Tool({
    provider: model.provider,
    name: "fetch-news",
    description:
        "Fetch the latest news articles about a given topic. The maximum limit is 3",
    parameters: z.object({
        topic: z.string().describe("The topic to search for"),
        limit: z.number().describe("Number of articles to fetch"),
    }),
    execute: async ({ limit = 3 }) => {
        const articles = [
            {
                title: "AI Advances in 2024",
                content:
                    "Recent developments in artificial intelligence show promising results in various fields...",
            },
            {
                title: "The Future of Technology",
                content:
                    "Emerging technologies are reshaping how we live and work...",
            },
            {
                title: "Innovation in Tech Industry",
                content:
                    "Leading companies are pushing boundaries in technological innovation...",
            },
        ];
        return articles.slice(0, limit);
    },
});

const researchAgent = new Agent({
    name: "Research Agent",
    model,
    description: "An AI researcher that fetches and analyzes news articles.",
    instructions: [
        "Use the fetch-news tool to get articles about the requested topic",
        "Analyze the content of the articles",
        "Identify key trends and insights",
    ],
    tools: {
        fetchNews,
    },
});

const summaryAgent = new Agent({
    name: "Summary Agent",
    model,
    description:
        "An AI writer that creates concise summaries from research analysis.",
    instructions: [
        "Review the research analysis provided",
        "Create a clear and concise summary",
        "Highlight the most important points",
        "Use bullet points for key takeaways",
    ],
});

const zee = new ZeeWorkflow({
    goal: "Analyze latest technology news and create a summary report",
    agents: [researchAgent, summaryAgent],
    model,
    config: {
        temperature: 1,
        maxIterations: 50,
    },
});

(async function main() {
    const result = await zee.run();
    console.log("\nFinal Summary:");
    console.log(result);
})();
