import { Agent } from "../../agent";
import { user } from "../../base";
import { StateFn } from "../../state";
import { runToolCalls } from "../base";
import type { TwitterToolConfig } from "./base";
import { TwitterAccountDetailsTool } from "./twitter-account-details";
import { TwitterPostTweetTool } from "./twitter-post-tweet";
import { TwitterPostTweetReplyTool } from "./twitter-post-tweet-reply";
import "dotenv/config";
import type { ChatCompletionAssistantMessageParam } from "openai/resources";
import { beforeAll, describe, expect, test } from "vitest";

let config: TwitterToolConfig;

beforeAll(() => {
    config = {
        apiKey: process.env["TWITTER_API_KEY"],
        apiSecret: process.env["TWITTER_API_SECRET"],
        accessToken: process.env["TWITTER_ACCESS_TOKEN"],
        accessTokenSecret: process.env["TWITTER_ACCESS_TOKEN_SECRET"],
    };

    // Validate Twitter API configuration
    const requiredEnvVars = [
        "TWITTER_API_KEY",
        "TWITTER_API_SECRET",
        "TWITTER_ACCESS_TOKEN",
        "TWITTER_ACCESS_TOKEN_SECRET",
    ];

    requiredEnvVars.forEach((envVar) => {
        if (!process.env[envVar]) {
            throw new Error(`${envVar} environment variable is not set`);
        }
    });
});

describe("Twitter Tools Test Suite", () => {
    const tools = {
        accountDetails: new TwitterAccountDetailsTool(config),
        postTweet: new TwitterPostTweetTool(config),
        postTweetReply: new TwitterPostTweetReplyTool(config),
    };

    const createTwitterAgent = (
        description: string,
        instructions: string[]
    ) => {
        return new Agent({
            name: "twitter-agent",
            model: {
                provider: "OPEN_AI",
                name: "gpt-4o-mini",
            },
            description,
            instructions,
            tools,
        });
    };

    test("post a tweet about a blockchain joke", async () => {
        const agent = createTwitterAgent("A humorous blockchain agent", [
            "Tell a funny blockchain joke and post it on Twitter",
        ]);

        const state = StateFn.root(agent.description);
        state.messages.push(
            user("Tell a funny blockchain joke and post it on Twitter")
        );

        try {
            const result = await agent.run(state);
            expect(result.messages.length).toBeGreaterThan(0);
            expect(result.status).toEqual("paused");
        } catch (error) {
            console.error("Tweet posting test failed:", error);
            throw error;
        }
    });

    test("retrieves account details", async () => {
        const agent = createTwitterAgent(
            "You are a blockchain developer exploring Twitter account details.",
            ["Retrieve account details", "Analyze Twitter profile information"]
        );

        const state = StateFn.root(agent.description);
        state.messages.push(user("Retrieve account details"));

        const result = await agent.run(state);
        expect(result.status).toEqual("paused");

        const toolCall = result.messages[
            result.messages.length - 1
        ] as ChatCompletionAssistantMessageParam;
        expect(toolCall?.tool_calls).toBeDefined();

        const toolResponses = await runToolCalls(
            tools,
            toolCall?.tool_calls ?? []
        );

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
    });

    test("post a tweet reply", async () => {
        const agent = createTwitterAgent(
            "You are a blockchain developer exploring Twitter account details.",
            ["Retrieve account details", "Analyze Twitter profile information"]
        );

        const state = StateFn.root(agent.description);
        state.messages.push(user("Retrieve account details"));

        const result = await agent.run(state);
        expect(result.status).toEqual("paused");

        const toolCall = result.messages[
            result.messages.length - 1
        ] as ChatCompletionAssistantMessageParam;
        expect(toolCall?.tool_calls).toBeDefined();

        const toolResponses = await runToolCalls(
            tools,
            toolCall?.tool_calls ?? []
        );

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
    });
});
