import type { ModelProvider } from "../llm";
import type { Tool } from "./tool";
import type { AnyZodObject, infer as ZodInfer } from "zod";

export interface ToolParams<ZOD_OBJECT extends AnyZodObject> {
    name: string;
    description: string;
    parameters: ZOD_OBJECT;
    execute: (params: ZodInfer<ZOD_OBJECT>) => Promise<unknown>;
    provider: ModelProvider["provider"];
}

export type ToolSet = Record<string, Tool<AnyZodObject>>;
