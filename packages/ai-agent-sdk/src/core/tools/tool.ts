import type { ToolParams } from ".";
import { tool } from "ai";
import type { AnyZodObject } from "zod";

export class Tool<T extends AnyZodObject> {
    constructor(params: ToolParams<T>) {
        return tool({
            id: `${params.provider}.${params.name}` satisfies `${string}.${string}`,
            description: params.description,
            parameters: params.parameters,
            execute: params.execute,
        });
    }
}
