import { Tool } from "../tool";
import { type ToolParams } from "../tool.types";
import { GoldRushClient } from "@covalenthq/client-sdk";
import type { AnyZodObject } from "zod";

export abstract class BaseGoldRushTool<
    ZOD_OBJECT extends AnyZodObject,
> extends Tool<ZOD_OBJECT> {
    protected client: GoldRushClient;

    constructor(params: ToolParams<ZOD_OBJECT>) {
        if (!process.env["GOLDRUSH_API_KEY"]) {
            throw new Error("GOLDRUSH_API_KEY is not set in the env");
        }

        super({
            provider: params.provider,
            name: params.name,
            description: params.description,
            parameters: params.parameters,
            execute: params.execute,
        });

        this.client = new GoldRushClient(process.env["GOLDRUSH_API_KEY"]!);
    }

    public static bigIntSerializer(data: object | object[]) {
        return JSON.parse(
            JSON.stringify(data, (_key: string, value: unknown) => {
                if (typeof value === "bigint") {
                    return value.toString();
                }
                return value;
            })
        );
    }
}
