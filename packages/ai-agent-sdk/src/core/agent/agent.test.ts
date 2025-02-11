import { Agent } from ".";
import { Base } from "../base";
import { tool } from "ai";
import fetch from "node-fetch";
import { describe, test } from "vitest";
import { z } from "zod";

describe("agent", () => {
    // const providers: ModelConfig[] = [
    //     {
    //         provider: "OPEN_AI",
    //         name: "gpt-4o-mini",
    //     },
    //     {
    //         provider: "GEMINI",
    //         name: "gemini-1.5-flash",
    //     },
    // ] as const;

    // providers.forEach((config) => {
    // describe(config.provider, () => {
    // test("default agent flow", async () => {
    //     const agent = new Agent({
    //         name: "research agent",
    //         // model: config,
    //         description:
    //             "You are a senior NYT researcher writing an article on a topic.",
    //         instructions: [
    //             "For a given topic, search for the top 5 links.",
    //             "Then read each URL and extract the article text, if a URL isn't available, ignore it.",
    //             "Analyze and prepare an NYT worthy article based on the information.",
    //         ],
    //     });

    //     const schema = {
    //         article: z.object({
    //             title: z.string(),
    //             text: z.string(),
    //         }),
    //     };

    //     const result = await agent.generate(
    //         [Base.user("The future of AI")],
    //         schema
    //     );

    //     console.log(result);

    //     if (result.type !== "article") {
    //         throw new Error(`Expected article response, got ${result.type}`);
    //     }

    //     expect(result.value["title"]).toBeDefined();
    //     expect(result.value["text"]).toBeDefined();
    // });

    test("agent with custom tool", async () => {
        const tools = {
            weather: tool({
                description: "Fetch the current weather in a location",
                parameters: z.object({
                    location: z.string(),
                }),
                execute: async ({ location }) => {
                    const r = await fetch(
                        `https://api.weatherapi.com/v1/current.json?q=${location}&key=88f97127772c41a991095603230604`
                    );
                    const data = await r.json();
                    console.log("TOOL API CALLED");

                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    return `Current temperature in ${data.location.name}, ${data.location.region}, ${data.location.country} is ${data.current.temp_c}°C or ${data.current.temp_f}°F`;
                },
            }),
        };

        const agent = new Agent({
            name: "research agent",
            // model: config,
            description:
                "You are a senior NYT researcher writing an article on the current weather for the provided location.",
            instructions: [
                "Use the weather tool to get the current weather in Celsius.",
                "Elaborate on the weather.",
            ],
            tools,
        });

        const result = await agent.generate(
            [Base.user("What is the weather in Delhi?")],
            {
                article: z.object({
                    title: z.string(),
                    text: z.string(),
                }),
            }
        );

        console.log(result);

        // const state = StateFn.root(agent.description);
        // state.messages.push(Base.user("What is the weather in Delhi?"));

        // const result = await agent.run(state);
        // console.log(result);
        // expect(result.status).toEqual("paused");
        // expect(result.messages.length).toBeGreaterThan(0);
    });
    // });
    // });
});
