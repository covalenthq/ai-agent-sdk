import type { ToolParams } from "../tool.types";
import type { AnyZodObject } from "zod";

export type GoldRushToolParams<ZOD_OBJECT extends AnyZodObject> =
    ToolParams<ZOD_OBJECT> & {
        apiKey: string;
    };
