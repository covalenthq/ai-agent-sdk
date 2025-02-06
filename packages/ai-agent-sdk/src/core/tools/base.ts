import type { AnyZodType } from "../base";
import type { ChatCompletionToolMessageParam } from "openai/resources";
import type { ParsedFunctionToolCall } from "openai/resources/beta/chat/completions";

export class Tool {
    private id: string;
    private _schema: AnyZodType;
    private _description: string;

    private _execute: (parameters: unknown) => Promise<string>;

    constructor(
        id: string,
        description: string,
        schema: AnyZodType,
        execute: (parameters: unknown) => Promise<string>
    ) {
        this.id = id;
        this._description = description;
        this._schema = schema;
        this._execute = execute;
    }

    get description() {
        return this._description;
    }

    get schema() {
        return this._schema;
    }

    execute(parameters: unknown) {
        return this._execute(parameters);
    }
}

interface ToolOptions {
    id: string;
    description: string;
    schema: AnyZodType;
    execute: (parameters: unknown) => Promise<string>;
}

export const createTool = (options: ToolOptions) => {
    return new Tool(
        options.id,
        options.description,
        options.schema,
        options.execute
    );
};

export const runToolCalls = async (
    tools: Record<string, Tool>,
    toolCalls: ParsedFunctionToolCall[]
): Promise<ChatCompletionToolMessageParam[]> => {
    const results = await Promise.all(
        toolCalls.map(async (tc) => {
            if (tc.type !== "function") {
                throw new Error("Tool call needs to be a function");
            }

            const tool = tools[tc.function.name];
            if (!tool) {
                throw new Error(`Tool ${tc.function.name} not found`);
            }

            const response = await tool.execute(
                JSON.parse(tc.function.arguments)
            );

            return {
                role: "tool",
                tool_call_id: tc.id,
                content: response,
            } satisfies ChatCompletionToolMessageParam;
        })
    );

    return results;
};
