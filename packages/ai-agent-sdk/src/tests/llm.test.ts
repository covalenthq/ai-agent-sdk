import { LLM, Tool, userMessage, type ModelProvider, type ToolSet } from "..";
import fetch from "node-fetch";
import { describe, expect, test } from "vitest";
import { z } from "zod";

describe("@ai-agent-sdk/llm", () => {
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
            const llm = new LLM(model);

            test("structured output", async () => {
                const schema = z.object({
                    answer: z.string(),
                    explanation: z.string(),
                });

                const result = await llm.generate<typeof schema>({
                    prompt: "What is 5 plus 7?",
                    schema,
                });

                console.log(result);

                if (typeof result.value !== "object") {
                    throw new Error("Expected structured output");
                }

                expect(result.type).toBe("assistant");
                expect(result.value["answer"]).toBeDefined();
                expect(result.value["explanation"]).toBeDefined();
            });

            test("tool calling", async () => {
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

                const result = await llm.generate({
                    prompt: "What is the weather in San Francisco?",
                    tools,
                });

                console.log(result);

                expect(result.type).toBe("assistant");
                expect(result.value).toBeDefined();
            });

            test("multimodal image url input", async () => {
                const schema = z.object({
                    description: z.string(),
                    colors: z.array(z.string()),
                    text_content: z.string().optional(),
                    improvements: z.string().optional(),
                });

                const result = await llm.generate({
                    messages: [
                        userMessage(
                            "What's in this image? Suggest Improvements to the logo as well"
                        ),
                        userMessage([
                            {
                                type: "image",
                                image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png",
                            },
                        ]),
                    ],
                    schema,
                });

                console.log(result);

                expect(result.type).toBe("assistant");
                expect(result.value).toBeDefined();
            });

            test("multimodal image base64 input", async () => {
                const schema = z.object({
                    description: z.string(),
                    colors: z.array(z.string()),
                    text_content: z.string().optional(),
                });

                const base64Image =
                    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";

                const result = await llm.generate({
                    messages: [
                        userMessage("What's in this image?"),
                        userMessage([
                            {
                                type: "image",
                                image: base64Image,
                            },
                        ]),
                    ],
                    schema,
                });

                console.log(result);

                expect(result.type).toBe("assistant");
                expect(result.value).toBeDefined();
            });

            // TODO: add audio and file multimodal input tests
        });
    });
});
