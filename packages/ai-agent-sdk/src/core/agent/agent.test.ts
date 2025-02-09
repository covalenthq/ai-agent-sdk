import { Agent } from ".";
import { user } from "../base";
import type { ModelConfig } from "../llm";
import { StateFn } from "../state";
import { createTool, runToolCalls } from "../tools";
import fetch from "node-fetch";
import type { ChatCompletionAssistantMessageParam } from "openai/resources";
import { describe, expect, test } from "vitest";
import { z } from "zod";

describe("agent", () => {
    const providers: ModelConfig[] = [
        {
            provider: "OPEN_AI",
            name: "gpt-4o-mini",
        },
        {
            provider: "GEMINI",
            name: "gemini-1.5-flash",
        },
    ] as const;

    providers.forEach((config) => {
        describe(config.provider, () => {
            test("default agent flow", async () => {
                const agent = new Agent({
                    name: "research agent",
                    model: config,
                    description:
                        "You are a senior NYT researcher writing an article on a topic.",
                    instructions: [
                        "For a given topic, search for the top 5 links.",
                        "Then read each URL and extract the article text, if a URL isn't available, ignore it.",
                        "Analyse and prepare an NYT worthy article based on the information.",
                    ],
                });

                const schema = {
                    article: z.object({
                        title: z.string(),
                        text: z.string(),
                    }),
                };

                const result = await agent.generate(
                    [user("The future of AI")],
                    schema
                );

                console.log(result);

                if (result.type !== "article") {
                    throw new Error(
                        `Expected article response, got ${result.type}`
                    );
                }

                expect(result.value["title"]).toBeDefined();
                expect(result.value["text"]).toBeDefined();
            });

            test("agent with custom tool", async () => {
                const tools = {
                    weather: createTool({
                        id: "weather-tool",
                        description:
                            "Fetch the current weather in Vancouver, BC",
                        schema: z.object({
                            temperature: z.number(),
                        }),
                        execute: async (_args) => {
                            const lat = 49.2827,
                                lon = -123.1207;

                            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

                            const r = await fetch(url);
                            const data = await r.json();

                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-expect-error
                            return `Current temperature in Vancouver, BC is ${data.current_weather.temperature}°C`;
                        },
                    }),
                };

                const agent = new Agent({
                    name: "research agent",
                    model: config,
                    description:
                        "You are a senior NYT researcher writing an article on the current weather in Vancouver, BC.",
                    instructions: [
                        "Use the weather tool to get the current weather in Celsius.",
                        "Elaborate on the weather.",
                    ],
                    tools,
                });

                const state = StateFn.root(agent.description);
                state.messages.push(
                    user("What is the weather in Vancouver, BC?")
                );

                const result = await agent.run(state);
                expect(result.status).toEqual("paused");
                expect(result.messages.length).toBeGreaterThan(0);

                const toolCall = result.messages[
                    result.messages.length - 1
                ] as ChatCompletionAssistantMessageParam;
                expect(toolCall?.tool_calls?.length).toBeGreaterThanOrEqual(1);

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

                console.log(finalResult);

                expect(finalResult.messages.length).toBeGreaterThan(1);
                expect(finalResult.status).toEqual("finished");
            });
        });
    });
});
