import { Tool } from "../index";
import { GoldRushClient, ChainName } from "@covalenthq/client-sdk";
import { z } from "zod";

export const BaseGoldRushSchema = z.object({
    chain: z.enum(Object.values(ChainName) as [string, ...string[]]),
    address: z.string(),
});

export abstract class BaseGoldRushTool extends Tool {
    protected client: GoldRushClient;

    constructor(
        id: string,
        description: string,
        schema: z.ZodType<any>,
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

    protected abstract fetchData(params: any): Promise<string>;

    protected bigIntReplacer(_key: string, value: any) {
        if (typeof value === "bigint") {
            return value.toString();
        }
        return value;
    }
}
