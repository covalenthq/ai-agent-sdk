import {
    HistoricalTokenPriceTool,
    NFTBalancesTool,
    TokenBalancesTool,
    TransactionsTool,
} from ".";
import { type ToolSet, userMessage } from "../../..";
import { Agent } from "../../agent";
import { type ModelProvider } from "../../llm";
import "dotenv/config";
import { describe, expect, test } from "vitest";

describe("@ai-agent-sdk/tools/goldrush", () => {
    const providers: ModelProvider[] = [
        {
            provider: "openai",
            id: "gpt-4o-mini",
        },
        {
            provider: "google",
            id: "gemini-1.5-flash",
        },
    ];

    providers.forEach((model) => {
        describe(`${model.provider}::${model.id}`, () => {
            test("token balances tool with an agent", async () => {
                const tools: ToolSet = {
                    tokenBalances: new TokenBalancesTool(
                        model.provider,
                        process.env["GOLDRUSH_API_KEY"]!
                    ),
                };

                const agent = new Agent({
                    name: "token balances agent",
                    model,
                    description:
                        "You are a senior blockchain researcher analyzing wallet activities across different chains.",
                    instructions: [
                        "Summarize token holdings",
                        "Provide insights about the token holdings",
                    ],
                    tools,
                });

                const result = await agent.generate({
                    messages: [
                        userMessage(
                            "What are the token balances for karanpargal.eth on eth-mainnet?"
                        ),
                    ],
                });

                console.log(result);

                expect(result.type).toBe("assistant");
                expect(result.value).toBeDefined();
            });

            test("token balances tool with an agent", async () => {
                const tools: ToolSet = {
                    transactions: new TransactionsTool(
                        model.provider,
                        process.env["GOLDRUSH_API_KEY"]!
                    ),
                };

                const agent = new Agent({
                    name: "token balances agent",
                    model,
                    description:
                        "You are a senior blockchain researcher analyzing wallet activities across different chains.",
                    instructions: [
                        "Summarize transactions",
                        "Provide insights about the transactions",
                    ],
                    tools,
                });

                const result = await agent.generate({
                    messages: [
                        userMessage(
                            "What are the transactions for karanpargal.eth on eth-mainnet?"
                        ),
                    ],
                });

                console.log(result);

                expect(result.type).toBe("assistant");
                expect(result.value).toBeDefined();
            });

            test("nft balances tool with an agent", async () => {
                const tools: ToolSet = {
                    nftBalances: new NFTBalancesTool(
                        model.provider,
                        process.env["GOLDRUSH_API_KEY"]!
                    ),
                };

                const agent = new Agent({
                    name: "nft balances agent",
                    model,
                    description:
                        "You are a senior blockchain researcher analyzing wallet activities across different chains.",
                    instructions: [
                        "Summarize nft holdings",
                        "Provide insights about the nft holdings",
                    ],
                    tools,
                });

                const result = await agent.generate({
                    messages: [
                        userMessage(
                            "What are the nft holdings for karanpargal.eth on eth-mainnet?"
                        ),
                    ],
                });

                console.log(result);

                expect(result.type).toBe("assistant");
                expect(result.value).toBeDefined();
            });

            test("nft balances tool with an agent", async () => {
                const tools: ToolSet = {
                    historicalTokenPrice: new HistoricalTokenPriceTool(
                        model.provider,
                        process.env["GOLDRUSH_API_KEY"]!
                    ),
                };

                const agent = new Agent({
                    name: "historical token price agent",
                    model,
                    description:
                        "You are a senior blockchain researcher analyzing activities across different chains.",
                    instructions: [
                        "Summarize historical token prices",
                        "Provide insights about the historical token prices",
                    ],
                    tools,
                });

                const result = await agent.generate({
                    messages: [
                        userMessage(
                            "What are the historical token prices for 0x7abc8a5768e6be61a6c693a6e4eacb5b60602c4d on eth-mainnet over the past week?"
                        ),
                    ],
                });

                console.log(result);

                expect(result.type).toBe("assistant");
                expect(result.value).toBeDefined();
            });

            test("multiple goldrush tools with an agent", async () => {
                const tools: ToolSet = {
                    tokenBalances: new TokenBalancesTool(
                        model.provider,
                        process.env["GOLDRUSH_API_KEY"]!
                    ),
                    nftBalances: new NFTBalancesTool(
                        model.provider,
                        process.env["GOLDRUSH_API_KEY"]!
                    ),
                    transactions: new TransactionsTool(
                        model.provider,
                        process.env["GOLDRUSH_API_KEY"]!
                    ),
                };

                const agent = new Agent({
                    name: "goldrush agent",
                    model,
                    description:
                        "You are a senior blockchain researcher analyzing wallet activities across different chains.",
                    instructions: [
                        "Analyze wallet activities using the provided blockchain tools",
                        "Summarize token holdings, NFT collections, and recent transactions",
                        "Provide insights about the wallet's activity patterns",
                    ],
                    tools,
                });

                const result = await agent.generate({
                    messages: [
                        userMessage(
                            "What is the activity of karanpargal.eth on eth-mainnet?"
                        ),
                    ],
                });

                console.log(result);

                expect(result.type).toBe("assistant");
                expect(result.value).toBeDefined();
            });
        });
    });
});
