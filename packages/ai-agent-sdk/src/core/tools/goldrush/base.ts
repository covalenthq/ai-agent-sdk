import { Tool } from "../base";
import { ChainName, GoldRushClient } from "@covalenthq/client-sdk";
import { z, type AnyZodObject } from "zod";

export const BaseGoldRushSchema = z.object({
    chain: z.enum(Object.values(ChainName) as [string, ...string[]]),
    address: z.string(),
});

export abstract class BaseGoldRushTool extends Tool {
    protected client: GoldRushClient;

    constructor(
        id: string,
        description: string,
        schema: AnyZodObject,
        apiKey: string = process.env["GOLDRUSH_API_KEY"] ?? ""
    ) {
        super(
            id,
            description,
            schema,
            async (parameters) => await this.fetchData(parameters)
        );

        if (!apiKey) {
            throw new Error("GOLDRUSH_API_KEY is not set");
        }

        this.client = new GoldRushClient(apiKey);
    }

    protected abstract fetchData(params: unknown): Promise<string>;

    protected bigIntReplacer(_key: string, value: unknown) {
        if (typeof value === "bigint") {
            return value.toString();
        }
        return value;
    }
}
