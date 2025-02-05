import { user } from "../base";
import { LLM } from "./llm";
import type { ModelConfig } from "./llm.types";
import { type ChatCompletionMessageParam } from "openai/resources";
import { describe, expect, test } from "vitest";
import z from "zod";

describe("@ai-agent-sdk/llm", () => {
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
            const llm = new LLM(config);

            test("text with custom schema output", async () => {
                const schema = {
                    step: z.object({
                        answer: z.string(),
                        explanation: z.number(),
                    }),
                };

                const result = await llm.generate(
                    [user("What is the answer to 5+7?")],
                    schema,
                    {}
                );

                console.log(result);

                if (result.type !== "step") {
                    throw new Error(
                        `Expected step response, got ${result.type}`
                    );
                }

                expect(result.value).toBeDefined();
                expect(result.value["answer"]).toBeDefined();
                expect(result.value["answer"]).toEqual("12");
                expect(result.value["explanation"]).toBeDefined();
            });

            test.skipIf(config.provider === "GEMINI")(
                "image with custom schema output",
                async () => {
                    const messages: ChatCompletionMessageParam[] = [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: "What's in this image? Suggest Improvements to the logo as well",
                                },

                                {
                                    type: "image_url",
                                    image_url: {
                                        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png",
                                        detail: "auto",
                                    },
                                },
                            ],
                        },
                    ];

                    const schema = {
                        analysis: z.object({
                            description: z.string(),
                            colors: z.array(z.string()),
                            text_content: z.string().optional(),
                            improvements: z.string().optional(),
                        }),
                    };

                    const result = await llm.generate(messages, schema, {});

                    console.log(result);

                    if (result.type !== "analysis") {
                        throw new Error(
                            `Expected step response, got ${result.type}`
                        );
                    }

                    expect(result.value).toBeDefined();
                    expect(result.value.description).toBeDefined();
                    expect(result.value.colors).toBeDefined();
                    expect(Array.isArray(result.value.colors)).toBe(true);
                }
            );

            test.skipIf(config.provider === "GEMINI")(
                "image as base64 input",
                async () => {
                    const messages: ChatCompletionMessageParam[] = [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: "What's in this image and what color is it?",
                                },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
                                        detail: "auto",
                                    },
                                },
                            ],
                        },
                    ];

                    const schema = {
                        analysis: z.object({
                            description: z.string(),
                            color: z.string(),
                            dimensions: z.object({
                                width: z.number(),
                                height: z.number(),
                            }),
                        }),
                    };

                    const result = await llm.generate(messages, schema, {});

                    console.log("Base64 image analysis result:", result);

                    if (result.type !== "analysis") {
                        throw new Error(
                            `Expected analysis response, got ${result.type}`
                        );
                    }

                    expect(result.value).toBeDefined();
                    expect(result.value.description).toBeDefined();
                    expect(result.value.color).toBeDefined();
                    expect(result.value.dimensions).toBeDefined();
                }
            );
        });
    });
});
