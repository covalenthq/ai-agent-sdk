import { Agent } from "../../agent";
import { user } from "../../base";
import { StateFn } from "../../state";
import type { Tool } from "../index";
import { NFTBalancesTool } from "./nft-balances";
import { TokenBalancesTool } from "./token-balances";
import { TransactionsTool } from "./transactions";
import "dotenv/config";
import type {
    ChatCompletionToolMessageParam,
    ChatCompletionAssistantMessageParam,
} from "openai/resources";
import type { ParsedFunctionToolCall } from "openai/resources/beta/chat/completions";
import { expect, test, beforeAll } from "vitest";

let apiKey: string;

beforeAll(() => {
    if (!process.env["GOLDRUSH_API_KEY"]) {
        throw new Error("GOLDRUSH_API_KEY environment variable is not set");
    }
    apiKey = process.env["GOLDRUSH_API_KEY"];
});

test("blockchain research agent with goldrush tools", async () => {
    const tools = {
        tokenBalances: new TokenBalancesTool(apiKey),
        nftBalances: new NFTBalancesTool(apiKey),
        transactions: new TransactionsTool(apiKey),
    };

    const agent = new Agent({
        name: "blockchain researcher",
        model: {
            provider: "OPEN_AI",
            name: "gpt-4o-mini",
        },
        description:
            "You are a blockchain researcher analyzing wallet activities across different chains.",
        instructions: [
            "Analyze wallet activities using the provided blockchain tools",
            "Summarize token holdings, NFT collections, and recent transactions",
            "Provide insights about the wallet's activity patterns",
        ],
        tools,
    });

    const state = StateFn.root(agent.description);
    state.messages.push(
        user(
            "Analyze wallet address karanpargal.eth on eth-mainnet and provide a complete analysis of its activities"
        )
    );

    try {
        const result = await agent.run(state);
        console.log(result);

        expect(result.messages.length).toBeGreaterThan(0);
        expect(result.status).toEqual("paused");
    } catch (error) {
        console.error("Test failed:", error);
        throw error;
    }
});

test("blockchain research agent should analyze token balances", async () => {
    const tools = {
        tokenBalances: new TokenBalancesTool(apiKey),
    };

    const agent = new Agent({
        name: "token analyzer",
        model: {
            provider: "OPEN_AI",
            name: "gpt-4o-mini",
        },
        description:
            "You are a blockchain researcher analyzing wallet token holdings.",
        instructions: [
            "Analyze wallet token balances using the provided blockchain tools",
            "Provide insights about the wallet's token holdings",
        ],
        tools,
    });

    const state = StateFn.root(agent.description);
    state.messages.push(
        user(
            "Analyze the token balances for address karanpargal.eth on eth-mainnet"
        )
    );

    const result = await agent.run(state);
    expect(result.status).toEqual("paused");

    const toolCall = result.messages[
        result.messages.length - 1
    ] as ChatCompletionAssistantMessageParam;
    expect(toolCall?.tool_calls).toBeDefined();

    const toolResponses = await runToolCalls(tools, toolCall?.tool_calls ?? []);

    const updatedState = {
        ...result,
        status: "running" as const,
        messages: [...result.messages, ...toolResponses],
    };

    const finalResult = await agent.run(updatedState);

    expect(finalResult.status).toEqual("finished");
    expect(
        finalResult.messages[finalResult.messages.length - 1]?.content
    ).toBeDefined();
    console.log(
        "Final analysis:",
        finalResult.messages[finalResult.messages.length - 1]?.content
    );
});

test("blockchain research agent should analyze NFT holdings", async () => {
    const tools = {
        nftBalances: new NFTBalancesTool(apiKey),
    };

    const agent = new Agent({
        name: "nft analyzer",
        model: {
            provider: "OPEN_AI",
            name: "gpt-4o-mini",
        },
        description:
            "You are a blockchain researcher analyzing NFT collections.",
        instructions: [
            "Analyze wallet NFT holdings using the provided blockchain tools",
            "Summarize the NFT collections owned by the wallet",
        ],
        tools,
    });

    const state = StateFn.root(agent.description);
    state.messages.push(
        user("What NFTs does address karanpargal.eth own on eth-mainnet?")
    );

    const result = await agent.run(state);
    console.log(result);
    expect(result.messages.length).toBeGreaterThan(1);
    expect(result.status).toEqual("paused");
});

test("blockchain research agent should analyze recent transactions", async () => {
    const tools = {
        transactions: new TransactionsTool(apiKey),
    };

    const agent = new Agent({
        name: "transaction analyzer",
        model: {
            provider: "OPEN_AI",
            name: "gpt-4o-mini",
        },
        description:
            "You are a blockchain researcher analyzing transaction patterns.",
        instructions: [
            "Analyze wallet transactions using the provided blockchain tools",
            "Identify patterns in transaction history",
        ],
        tools,
    });

    const state = StateFn.root(agent.description);
    state.messages.push(
        user(
            "Show me the last 24 hours of transactions for address karanpargal.eth on eth-mainnet"
        )
    );

    const result = await agent.run(state);
    console.log(result);
    expect(result.messages.length).toBeGreaterThan(1);
    expect(result.status).toEqual("paused");
});

async function runToolCalls(
    tools: Record<string, Tool>,
    toolCalls: ParsedFunctionToolCall[]
): Promise<ChatCompletionToolMessageParam[]> {
    const results = await Promise.all(
        toolCalls.map(async (tc) => {
            if (tc.type !== "function") {
                throw new Error("Tool call needs to be a function");
            }

            const tool = tools[tc.function.name];
            if (!tool) {
                throw new Error(`Tool ${tc.function.name} not found`);
            }

            const response = await tool.execute(
                JSON.parse(tc.function.arguments)
            );

            return {
                role: "tool",
                tool_call_id: tc.id,
                content: response,
            } satisfies ChatCompletionToolMessageParam;
        })
    );

    return results;
}
