import { Agent } from "../../agent";
import { user } from "../../base";
import { StateFn } from "../../state";
import { runToolCalls } from "../base";
import { ExecuteTransactionTool } from "./execute-transactions";
import "dotenv/config";
import type { ChatCompletionAssistantMessageParam } from "openai/resources";
import { beforeAll, expect, test } from "vitest";

let rpcUrl: string;
let privateKey: string;

beforeAll(() => {
    if (!process.env["RPC_URL"]) {
        throw new Error("RPC_URL environment variable is not set");
    }
    if (!process.env["PRIVATE_KEY"]) {
        throw new Error("PRIVATE_KEY environment variable is not set");
    }
    rpcUrl = process.env["RPC_URL"];
    privateKey = process.env["PRIVATE_KEY"];
});

test("transaction agent should execute ETH transfers", async () => {
    const tools = {
        transaction: new ExecuteTransactionTool(privateKey),
    };

    const agent = new Agent({
        name: "transaction executor",
        model: {
            provider: "OPEN_AI",
            name: "gpt-4o-mini",
        },
        description:
            "You are an expert at executing and validating blockchain transactions.",
        instructions: [
            "Parse transaction parameters from user input",
            "Execute transactions using the provided tools",
            "Verify transaction success and provide confirmation",
            "Handle any errors appropriately",
        ],
        tools,
    });

    const state = StateFn.root(agent.description);
    state.messages.push(
        user(
            `Send 0.001 ETH to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e using RPC URL ${rpcUrl}`
        )
    );

    const result = await agent.run(state);
    console.log(result);
    expect(result.status).toEqual("paused");

    const toolCall = result.messages[
        result.messages.length - 1
    ] as ChatCompletionAssistantMessageParam;
    expect(toolCall?.tool_calls).toBeDefined();

    if (toolCall.tool_calls) {
        toolCall.tool_calls.forEach((call) => {
            if (
                call.type === "function" &&
                call.function.name === "evm-transaction"
            ) {
                const args = JSON.parse(call.function.arguments);
                args.privateKey = privateKey;
                call.function.arguments = JSON.stringify(args);
            }
        });
    }

    const toolResponses = await runToolCalls(tools, toolCall?.tool_calls ?? []);

    const updatedState = {
        ...result,
        status: "running" as const,
        messages: [...result.messages, ...toolResponses],
    };

    const finalResult = await agent.run(updatedState);
    console.log(finalResult);

    expect(finalResult.status).toEqual("finished");
    expect(
        finalResult.messages[finalResult.messages.length - 1]?.content
    ).toBeDefined();

    const lastToolResponse = toolResponses[toolResponses.length - 1];
    const txResult = JSON.parse(lastToolResponse?.content as string);

    expect(txResult.status).toEqual("success");
    expect(txResult.transactionHash).toBeDefined();
    expect(txResult.blockNumber).toBeDefined();

    console.log(
        "Transaction Result:",
        finalResult.messages[finalResult.messages.length - 1]?.content
    );
});

test("transaction agent should handle failed transactions", async () => {
    const tools = {
        transaction: new ExecuteTransactionTool(privateKey),
    };

    const agent = new Agent({
        name: "transaction executor",
        model: {
            provider: "OPEN_AI",
            name: "gpt-4o-mini",
        },
        description:
            "You are an expert at executing and validating blockchain transactions.",
        instructions: [
            "Parse transaction parameters from user input",
            "Execute transactions using the provided tools",
            "Verify transaction success and provide confirmation",
            "Handle any errors appropriately",
        ],
        tools,
    });

    const state = StateFn.root(agent.description);
    state.messages.push(
        user(
            `Send 1000000 ETH to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e using RPC URL ${rpcUrl}`
        )
    );

    const result = await agent.run(state);
    expect(result.status).toEqual("paused");

    const toolCall = result.messages[
        result.messages.length - 1
    ] as ChatCompletionAssistantMessageParam;
    expect(toolCall?.tool_calls).toBeDefined();

    if (toolCall.tool_calls) {
        toolCall.tool_calls.forEach((call) => {
            if (
                call.type === "function" &&
                call.function.name === "evm-transaction"
            ) {
                const args = JSON.parse(call.function.arguments);
                args.privateKey = privateKey;
                call.function.arguments = JSON.stringify(args);
            }
        });
    }

    const toolResponses = await runToolCalls(tools, toolCall?.tool_calls ?? []);

    const updatedState = {
        ...result,
        status: "running" as const,
        messages: [...result.messages, ...toolResponses],
    };

    const finalResult = await agent.run(updatedState);

    expect(finalResult.status).toEqual("finished");

    const lastToolResponse = toolResponses[toolResponses.length - 1];
    const txResult = JSON.parse(lastToolResponse?.content as string);

    expect(txResult.status).toEqual("error");
    expect(txResult.message).toBeDefined();

    console.log(
        "Error Handling Result:",
        finalResult.messages[finalResult.messages.length - 1]?.content
    );
});
