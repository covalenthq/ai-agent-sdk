import { user } from "../base";
import { StateFn } from "../state";
import { createTool } from "../tools/base";
import { Agent } from "./index";
import fetch from "node-fetch";
import { expect, test } from "vitest";
import z from "zod";

test("research agent", async () => {
    const agent = new Agent({
        name: "research agent",
        model: {
            provider: "OPEN_AI",
            name: "gpt-4o-mini",
        },
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

    const result = await agent.generate([user("The future of AI")], schema);

    console.log(result);

    // expect(result.value['title']).toBeDefined();
    // expect(result.value['text']).toBeDefined();
});

test("research agent with tools", async () => {
    const weather = createTool({
        id: "weather-tool",
        description: "Fetch the current weather in Vancouver, BC",
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
    });

    const agent = new Agent({
        name: "research agent",
        model: {
            provider: "OPEN_AI",
            name: "gpt-4o-mini",
        },
        description:
            "You are a senior NYT researcher writing an article on the current weather in Vancouver, BC.",
        instructions: ["Use the weather tool to get the current weather"],
        tools: {
            weather,
        },
    });

    const state = StateFn.root(agent.description);

    const result = await agent.run(state);
    console.log(result);

    expect(result.messages.length).toEqual(2);
    expect(result.status).toEqual("paused");

    // expect(result.value['title']).toBeDefined();
    // expect(result.value['text']).toBeDefined();
});
