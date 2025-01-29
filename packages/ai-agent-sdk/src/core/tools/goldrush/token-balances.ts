import { BaseGoldRushTool, BaseGoldRushSchema } from "./base";
import { type Chain } from "@covalenthq/client-sdk";
import type { z } from "zod";

export const TokenBalancesSchema = BaseGoldRushSchema;
export type TokenBalancesParams = z.infer<typeof TokenBalancesSchema>;

export class TokenBalancesTool extends BaseGoldRushTool {
    constructor(apiKey?: string) {
        super(
            "token-balances",
            "Fetch token balances for a wallet address on a specific blockchain",
            TokenBalancesSchema,
            apiKey
        );
    }

    protected async fetchData(params: TokenBalancesParams): Promise<string> {
        try {
            const { chain, address } = params;
            const balances =
                await this.client.BalanceService.getTokenBalancesForWalletAddress(
                    chain as Chain,
                    address
                );

            if (balances.error) {
                throw new Error(balances.error_message);
            }

            return `Token balances for ${address} on ${chain}: ${JSON.stringify(balances.data, this.bigIntReplacer)}`;
        } catch (error) {
            return `Error fetching token balances: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
    }
}
