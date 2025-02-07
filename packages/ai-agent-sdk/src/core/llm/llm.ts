import { Base } from "../base";
import type { Tool } from "../tools/tool";
import type { FunctionToolCall, LLMResponse } from "./llm.types";
import { openai } from "@ai-sdk/openai";
import { type CoreMessage, generateObject } from "ai";
import type { AnyZodObject } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const formatOpenAITools = (tools: Record<string, Tool>) => {
    return Object.entries(tools).map(([name, tool]) => ({
        type: "function",
        function: {
            name,
            parameters: zodToJsonSchema(tool.schema),
            description: tool.description,
            strict: true,
        },
    }));
};

export class LLM extends Base {
    // private model: ModelConfig;

    constructor() {
        super("llm");
        // this.model = model;
    }

    public async generate<T extends Record<string, AnyZodObject>>(
        messages: CoreMessage[],
        response_schema: T,
        tools: Record<string, Tool>
    ): Promise<FunctionToolCall | LLMResponse<T>> {
        try {
            const response = await generateObject({
                model: openai("gpt-4o-mini"),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                schema: Object.values(response_schema)[0],
                messages,
                tools: tools ? formatOpenAITools(tools) : undefined,
                mode: "json",
            });

            if (!response.object) {
                throw new Error("No response object");
            }

            return {
                type: Object.keys(response_schema)[0] as keyof T,
                value: response.object,
            };
        } catch (error) {
            throw new Error(`Failed to parse response: ${error}`);
        }
    }
}
