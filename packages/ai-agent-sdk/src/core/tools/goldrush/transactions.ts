import { type ModelProvider } from "../../llm";
import { BaseGoldRushTool } from "./goldrush";
import { ChainName, type Chain } from "@covalenthq/client-sdk";
import { z } from "zod";

export const TransactionsSchema = z.object({
    chain: z.enum(Object.values(ChainName) as [string, ...string[]]),
    address: z.string(),
});

export type TransactionsParams = z.infer<typeof TransactionsSchema>;

export class TransactionsTool extends BaseGoldRushTool<
    typeof TransactionsSchema
> {
    constructor(provider: ModelProvider["provider"], apiKey: string) {
        super({
            provider,
            name: "transactions",
            description:
                "Fetch transactions for a wallet address on a specific blockchain",
            parameters: TransactionsSchema,
            apiKey,
            execute: async (params) => this.fetchData(params),
        });
    }

    protected async fetchData(params: TransactionsParams): Promise<string> {
        try {
            const { chain, address, timeframe = "24h" } = params;
            const txs =
                await this.client.TransactionService.getAllTransactionsForAddressByPage(
                    chain as Chain,
                    address,
                    {
                        noLogs: true,
                        withSafe: false,
                    }
                );

            if (txs.error) {
                throw new Error(txs.error_message);
            }

            return `Transactions for ${address} on ${chain} in last ${timeframe}: ${JSON.stringify(txs.data, this.bigIntSerializer)}`;
        } catch (error) {
            return `Error fetching transactions: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
    }
}
