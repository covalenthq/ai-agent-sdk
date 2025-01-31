import { BaseGoldRushTool, BaseGoldRushSchema } from "./base";
import { type Chain } from "@covalenthq/client-sdk";
import { z } from "zod";

export const TransactionsSchema = BaseGoldRushSchema.extend({
    timeframe: z.enum(["1h", "24h", "7d", "30d"]),
});

export type TransactionsParams = z.infer<typeof TransactionsSchema>;

export class TransactionsTool extends BaseGoldRushTool {
    constructor(apiKey?: string) {
        super(
            "transactions",
            "Fetch transactions for a wallet address on a specific blockchain",
            TransactionsSchema,
            apiKey
        );
    }

    protected async fetchData(params: TransactionsParams): Promise<string> {
        try {
            const { chain, address, timeframe = "24h" } = params;
            const txs =
                await this.client.TransactionService.getAllTransactionsForAddressByPage(
                    chain as Chain,
                    address,
                    {
                        quoteCurrency: "USD",
                        noLogs: true,
                        withSafe: true,
                    }
                );

            if (txs.error) {
                throw new Error(txs.error_message);
            }

            return `Transactions for ${address} on ${chain} in last ${timeframe}: ${JSON.stringify(txs.data, this.bigIntReplacer)}`;
        } catch (error) {
            return `Error fetching transactions: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
    }
}
