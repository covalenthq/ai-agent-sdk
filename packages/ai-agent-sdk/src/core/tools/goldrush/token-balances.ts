import { type ModelProvider } from "../../llm";
import { BaseGoldRushTool } from "./goldrush";
import { type Chain, ChainName } from "@covalenthq/client-sdk";
import { z } from "zod";

const TokenBalancesSchema = z.object({
    chain: z.enum(Object.values(ChainName) as [string, ...string[]]),
    address: z.string(),
});

export class TokenBalancesTool extends BaseGoldRushTool<
    typeof TokenBalancesSchema
> {
    constructor(provider: ModelProvider["provider"]) {
        super({
            provider,
            name: "token-balances",
            description:
                "Fetch token balances for a wallet address on a specific blockchain",
            parameters: TokenBalancesSchema,
            execute: async ({ address, chain }) => {
                const balances =
                    await this.client.BalanceService.getTokenBalancesForWalletAddress(
                        chain as Chain,
                        address
                    );

                if (balances.error) {
                    throw new Error(balances.error_message);
                }

                return BaseGoldRushTool.bigIntSerializer(
                    balances.data.items ?? []
                );
            },
        });
    }
}
