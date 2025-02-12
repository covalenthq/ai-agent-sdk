import { type ModelProvider } from "../../llm";
import { BaseGoldRushTool } from "./goldrush";
import { ChainName, type Chain } from "@covalenthq/client-sdk";
import { z } from "zod";

const NFTBalancesSchema = z.object({
    chain: z.enum(Object.values(ChainName) as [string, ...string[]]),
    address: z.string(),
});

export class NFTBalancesTool extends BaseGoldRushTool<
    typeof NFTBalancesSchema
> {
    constructor(provider: ModelProvider["provider"], apiKey: string) {
        super({
            provider,
            name: "nft-balances",
            description:
                "Fetch NFT balances for a wallet address on a specific blockchain",
            parameters: NFTBalancesSchema,
            apiKey,
            execute: async ({ address, chain }) => {
                const nfts = await this.client.NftService.getNftsForAddress(
                    chain as Chain,
                    address
                );

                if (nfts.error) {
                    throw new Error(nfts.error_message);
                }

                return BaseGoldRushTool.bigIntSerializer(nfts.data.items ?? []);
            },
        });
    }
}
