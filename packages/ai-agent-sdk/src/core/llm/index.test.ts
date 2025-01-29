import { LLM } from ".";
import { user } from "../base";
import { expect, test } from "vitest";
import z from "zod";

test("open ai integration - text", async () => {
    const llm = new LLM({
        provider: "OPEN_AI",
        name: "gpt-4o-mini",
    });

    const messages = [user("Hello, how are you?")];

    const schema = {
        text: z.object({
            value: z.string(),
        }),
    };

    const result = await llm.generate<typeof schema>(messages, schema, {});

    expect(result.value).toBeDefined();
    expect(typeof result.value).toBe("string");
});

test("open ai integration - structured output", async () => {
    const llm = new LLM({
        provider: "OPEN_AI",
        name: "gpt-4o-mini",
    });

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

    if (result.type !== "step") {
        throw new Error(`Expected step response, got ${result.type}`);
    }

    expect(result.value).toBeDefined();
    expect(result.value["answer"]).toBeDefined();
    expect(result.value["answer"]).toEqual("12");
    expect(result.value["explanation"]).toBeDefined();
});
