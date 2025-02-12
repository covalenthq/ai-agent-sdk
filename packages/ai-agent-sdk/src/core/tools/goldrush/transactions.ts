import { type ModelProvider } from "../../llm";
import { BaseGoldRushTool } from "./goldrush";
import { ChainName, type Chain } from "@covalenthq/client-sdk";
import { z } from "zod";

const TransactionsSchema = z.object({
    chain: z.enum(Object.values(ChainName) as [string, ...string[]]),
    address: z.string(),
});

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
            execute: async ({ address, chain }) => {
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

                return BaseGoldRushTool.bigIntSerializer(txs.data.items ?? []);
            },
        });
    }
}
