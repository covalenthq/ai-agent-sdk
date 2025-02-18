import { Agent, type ModelProvider, Tool, type ToolSet, userMessage } from "..";
import fetch from "node-fetch";
import { describe, expect, test } from "vitest";
import { z } from "zod";

describe("@ai-agent-sdk/agent", () => {
    const providers: ModelProvider[] = [
        {
            provider: "openai",
            id: "gpt-4o-mini",
        },
        {
            provider: "google",
            id: "gemini-1.5-flash",
        },
        {
            provider: "anthropic",
            id: "claude-3-5-sonnet-20240620",
        },
    ];

    providers.forEach((model) => {
        describe(`${model.provider}::${model.id}`, () => {
            test("default agent flow", async () => {
                const agent = new Agent({
                    name: "research agent",
                    model: model,
                    description:
                        "You are a senior New York Times researcher writing an article on a topic.",
                    instructions: [
                        "For a given topic, search for the top 5 links.",
                        "Then read each URL and extract the article text, if a URL isn't available, ignore it.",
                        "Analyze and prepare an New York Times worthy article based on the information.",
                    ],
                });

                const result = await agent.generate({
                    messages: [userMessage("Future of AI")],
                });

                console.log(result);

                expect(result.type).toBe("assistant");
                expect(result.value).toBeDefined();
            });

            test("agent with custom tool", async () => {
                const tools: ToolSet = {
                    weather: new Tool({
                        provider: model.provider,
                        name: "weather",
                        description: "Fetch the current weather in a location",
                        parameters: z.object({
                            location: z.string(),
                        }),
                        execute: async ({ location }) => {
                            const response = await fetch(
                                `https://api.weatherapi.com/v1/current.json?q=${location}&key=88f97127772c41a991095603230604`
                            );
                            const data = await response.json();
                            return data;
                        },
                    }),
                };

                const agent = new Agent({
                    name: "weather agent",
                    model,
                    description:
                        "You are a senior weather analyst writing a summary on the current weather for the provided location.",
                    instructions: [
                        "Use the weather tool to get the current weather in Celsius.",
                        "Elaborate on the weather.",
                    ],
                    tools,
                });

                const result = await agent.generate({
                    messages: [userMessage("What is the weather in Delhi?")],
                });

                console.log(result);

                expect(result.type).toBe("assistant");
                expect(result.value).toBeDefined();
            });
        });
    });
});
