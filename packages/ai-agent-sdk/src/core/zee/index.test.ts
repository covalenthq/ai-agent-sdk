import { Agent } from "../agent";
import { createTool } from "../tools";
import { ZeeWorkflow } from "./index";
import fetch from "node-fetch";
import { test } from "vitest";
import { z } from "zod";

test("test", async () => {
    const script_writer = new Agent({
        name: "script writer",
        description:
            "You are an expert screenplay writer. Given a movie idea and genre, develop a compelling script outline with character descriptions and key plot points.",
        instructions: [
            "Write a script outline with 3-5 main characters and key plot points.",
            "Outline the three-act structure and suggest 2-3 twists.",
            "Ensure the script aligns with the specified genre and target audience.",
        ],
        model: {
            provider: "OPEN_AI",
            name: "gpt-4o-mini",
        },
    });

    const producer = new Agent({
        name: "movie producer",
        description:
            "Experienced movie producer overseeing script and casting.",
        instructions: [
            "Ask script writer for a script outline based on the movie idea.",
            "Summarize the script outline.",
            "Provide a concise movie concept overview.",
        ],

        model: {
            provider: "OPEN_AI",
            name: "gpt-4o-mini",
        },
    });

    const zee = new ZeeWorkflow({
        description:
            "Plan a script for a movie that is 10 minutes long and has a happy ending.",
        output: "A scene by scene outline of the movie script.",
        agents: {
            script_writer,
            producer,
        },
    });

    const result = await ZeeWorkflow.run(zee);

    console.log(result);
});

test("workflow with tools", async () => {
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

    const zee = new ZeeWorkflow({
        description:
            "Plan a script for a movie that is 10 minutes long and has a climax dealing with the weather.",
        output: "A scene by scene outline of the movie script.",
        agents: {
            agent,
        },
    });

    const result = await ZeeWorkflow.run(zee);

    console.log(result);
});
