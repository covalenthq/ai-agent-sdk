import { type ModelProvider } from "../../llm";
import { BaseGoldRushTool } from "./goldrush";
import { ChainName, type Chain } from "@covalenthq/client-sdk";
import { z } from "zod";

const HistoricalTokenPriceSchema = z.object({
    chain: z.enum(Object.values(ChainName) as [string, ...string[]]),
    contractAddress: z.string(),
    timeframe: z.enum(["1h", "24h", "7d", "30d"]),
});

export class HistoricalTokenPriceTool extends BaseGoldRushTool<
    typeof HistoricalTokenPriceSchema
> {
    constructor(provider: ModelProvider["provider"], apiKey: string) {
        super({
            provider,
            name: "historical-token-price",
            description:
                "Fetch historical token prices for a specific token on a blockchain",
            parameters: HistoricalTokenPriceSchema,
            apiKey,
            execute: async ({ chain, contractAddress, timeframe }) => {
                let from: string | null = null;

                const formatDate = (date: Date) => {
                    return date.toISOString().split("T")[0]!;
                };

                switch (timeframe) {
                    case "1h":
                        from = formatDate(
                            new Date(Date.now() - 1000 * 60 * 60)
                        );
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

                return BaseGoldRushTool.bigIntSerializer(prices.data ?? []);
            },
        });
    }
}
