import { type GoldRushToolParams } from ".";
import { Tool } from "../tool";
import { GoldRushClient } from "@covalenthq/client-sdk";
import type { AnyZodObject } from "zod";

export abstract class BaseGoldRushTool<
    ZOD_OBJECT extends AnyZodObject,
> extends Tool<ZOD_OBJECT> {
    protected client: GoldRushClient;

    constructor(params: GoldRushToolParams<ZOD_OBJECT>) {
        if (!params.apiKey) {
            throw new Error("GOLDRUSH_API_KEY is not set");
        }

        super({
            provider: params.provider,
            name: params.name,
            description: params.description,
            parameters: params.parameters,
            execute: params.execute,
        });

        this.client = new GoldRushClient(params.apiKey);
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
