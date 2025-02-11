import { LLM, type ModelProvider } from ".";
import { createTool } from "../../functions";
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
    ];

    providers.forEach((config) => {
        describe(`${config.provider}::${config.id}`, () => {
            const llm = new LLM(config);

            test("structured output", async () => {
                const schema = z.object({
                    answer: z.string(),
                    explanation: z.number(),
                });

                const result = await llm.generate<typeof schema>({
                    prompt: "What is 5 plus 7?",
                    schema,
                });

                console.log(result);

                if (result.type !== "structured-output") {
                    throw new Error("Expected structured output");
                }

                expect(result.value["answer"]).toBeDefined();
                expect(result.value["explanation"]).toBeDefined();
            });

            test("tool calling", async () => {
                const result = await llm.generate({
                    prompt: "What is the weather in San Francisco?",
                    tools: {
                        weather: createTool({
                            description: "Get the weather in a location",
                            parameters: z.object({
                                location: z
                                    .string()
                                    .describe(
                                        "The location to get the weather for"
                                    ),
                            }),
                            execute: async ({ location }) => ({
                                location,
                                temperature:
                                    72 + Math.floor(Math.random() * 21) - 10,
                            }),
                        }),
                    },
                });

                console.log(result);

                expect(result.type).toBe("assistant");
                expect(result.value).toBeDefined();
            });

            // test.skipIf(config.provider === "GEMINI")(
            //     "image with custom schema output",
            //     async () => {
            //         const messages: ChatCompletionMessageParam[] = [
            //             {
            //                 role: "user",
            //                 content: [
            //                     {
            //                         type: "text",
            //                         text: "What's in this image? Suggest Improvements to the logo as well",
            //                     },

            //                     {
            //                         type: "image_url",
            //                         image_url: {
            //                             url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png",
            //                             detail: "auto",
            //                         },
            //                     },
            //                 ],
            //             },
            //         ];

            //         const schema = {
            //             analysis: z.object({
            //                 description: z.string(),
            //                 colors: z.array(z.string()),
            //                 text_content: z.string().optional(),
            //                 improvements: z.string().optional(),
            //             }),
            //         };

            //         const result = await llm.generate(messages, schema, {});

            //         console.log(result);

            //         if (result.type !== "analysis") {
            //             throw new Error(
            //                 `Expected step response, got ${result.type}`
            //             );
            //         }

            //         expect(result.value).toBeDefined();
            //         expect(result.value.description).toBeDefined();
            //         expect(result.value.colors).toBeDefined();
            //         expect(Array.isArray(result.value.colors)).toBe(true);
            //     }
            // );

            // test.skipIf(config.provider === "GEMINI")(
            //     "image as base64 input",
            //     async () => {
            //         const messages: ChatCompletionMessageParam[] = [
            //             {
            //                 role: "user",
            //                 content: [
            //                     {
            //                         type: "text",
            //                         text: "What's in this image and what color is it?",
            //                     },
            //                     {
            //                         type: "image_url",
            //                         image_url: {
            //                             url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
            //                             detail: "auto",
            //                         },
            //                     },
            //                 ],
            //             },
            //         ];

            //         const schema = {
            //             analysis: z.object({
            //                 description: z.string(),
            //                 color: z.string(),
            //                 dimensions: z.object({
            //                     width: z.number(),
            //                     height: z.number(),
            //                 }),
            //             }),
            //         };

            //         const result = await llm.generate(messages, schema, {});

            //         console.log("Base64 image analysis result:", result);

            //         if (result.type !== "analysis") {
            //             throw new Error(
            //                 `Expected analysis response, got ${result.type}`
            //             );
            //         }

            //         expect(result.value).toBeDefined();
            //         expect(result.value.description).toBeDefined();
            //         expect(result.value.color).toBeDefined();
            //         expect(result.value.dimensions).toBeDefined();
            //     }
            // );
        });
    });
});
