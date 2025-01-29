import { BaseGoldRushTool, BaseGoldRushSchema } from "./base";
import { type Chain } from "@covalenthq/client-sdk";
import type { z } from "zod";

export const NFTBalancesSchema = BaseGoldRushSchema;
export type NFTBalancesParams = z.infer<typeof NFTBalancesSchema>;

export class NFTBalancesTool extends BaseGoldRushTool {
    constructor(apiKey?: string) {
        super(
            "nft-balances",
            "Fetch NFT balances for a wallet address on a specific blockchain",
            NFTBalancesSchema,
            apiKey
        );
    }

    protected async fetchData(params: NFTBalancesParams): Promise<string> {
        try {
            const { chain, address } = params;
            const nfts = await this.client.NftService.getNftsForAddress(
                chain as Chain,
                address
            );

            if (nfts.error) {
                throw new Error(nfts.error_message);
            }

            return `NFT balances for ${address} on ${chain}: ${JSON.stringify(nfts.data, this.bigIntReplacer)}`;
        } catch (error) {
            return `Error fetching NFT balances: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
    }
}
