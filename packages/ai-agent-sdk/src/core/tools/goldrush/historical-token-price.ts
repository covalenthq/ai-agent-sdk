import { BaseGoldRushTool } from "./base";
import { ChainName, type Chain } from "@covalenthq/client-sdk";
import { z } from "zod";

export const HistoricalTokenPriceSchema = z.object({
    chain: z.enum(Object.values(ChainName) as [string, ...string[]]),
    address: z.string(),
    contractAddress: z.string(),
    timeframe: z.enum(["1h", "24h", "7d", "30d"]),
});

export type HistoricalTokenPriceParams = z.infer<
    typeof HistoricalTokenPriceSchema
>;

export class HistoricalTokenPriceTool extends BaseGoldRushTool {
    constructor(apiKey?: string) {
        if (!apiKey) {
            throw new Error("GOLDRUSH_API_KEY is not set");
        }
        super(
            "historical-token-price",
            "Fetch historical token prices for a specific token on a blockchain",
            HistoricalTokenPriceSchema,
            apiKey
        );
    }

    protected async fetchData(
        params: HistoricalTokenPriceParams
    ): Promise<string> {
        try {
            const { chain, contractAddress, timeframe } = params;
            let from: string | undefined;
            const formatDate = (date: Date) => {
                return date.toISOString().split("T")[0];
            };

            switch (timeframe) {
                case "1h":
                    from = formatDate(new Date(Date.now() - 1000 * 60 * 60));
                    break;
                case "24h":
                    from = formatDate(
                        new Date(Date.now() - 1000 * 60 * 60 * 24)
                    );
                    break;
                case "7d":
                    from = formatDate(
                        new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
                    );
                    break;
                case "30d":
                    from = formatDate(
                        new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
                    );
                    break;
            }
            const prices = await this.client.PricingService.getTokenPrices(
                chain as Chain,
                "USD",
                contractAddress,
                {
                    from: from,
                    to: formatDate(new Date(Date.now())),
                }
            );

            if (prices.error) {
                throw new Error(prices.error_message);
            }

            return `Historical token prices for ${contractAddress} on ${chain} in last ${timeframe}: ${JSON.stringify(prices.data, this.bigIntReplacer)}`;
        } catch (error) {
            return `Error fetching historical token prices: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
    }
}
