import type { AnyZodObject } from "zod";

export interface ToolOptions {
    id: string;
    description: string;
    schema: AnyZodObject;
    execute: (parameters: unknown) => Promise<string>;
}
