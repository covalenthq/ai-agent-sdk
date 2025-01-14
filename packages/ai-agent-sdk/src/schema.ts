import { memoizeWeakMap } from "./utils";
import { z } from "zod";

export const baseDataSchema = memoizeWeakMap(
    <T extends z.ZodTypeAny>(valueSchema: T) => {
        return z.object({
            data: valueSchema,
            error: z.boolean().optional().nullable(),
            error_message: z.string().nullable().optional(),
            error_code: z.number().nullable().optional(),
        });
    },
);

export const nftFloorPriceSchema = z.object({
    address: z.string(),
    updated_at: z.string(),
    quote_currency: z.string(),
    chain_id: z.number(),
    chain_name: z.string(),
    items: z.array(
        z.object({
            date: z.string(),
            native_ticker_symbol: z.string(),
            native_name: z.string(),
            floor_price_native_quote: z.number(),
            floor_price_quote: z.number(),
            pretty_floor_price_quote: z.string(),
        }),
    ),
});

export const allchainBalancesSchema = z.object({
    updated_at: z.string(),
    cursor_before: z.string(),
    quote_currency: z.string(),
    items: z.array(
        z.object({
            contract_decimals: z.number(),
            contract_name: z.string(),
            contract_ticker_symbol: z.string(),
            contract_address: z.string(),
            contract_display_name: z.string(),
            supports_erc: z.array(z.string()),
            logo_urls: z.object({
                token_logo_url: z.string(),
                protocol_logo_url: z.string(),
                chain_logo_url: z.string(),
            }),
            last_transferred_at: z.string(),
            is_native_token: z.boolean(),
            type: z.string(),
            is_spam: z.boolean(),
            balance: z.string(),
            balance24h: z.string(),
            quote_rate: z.number(),
            quote_rate24h: z.number(),
            quote: z.number(),
            quote24h: z.number(),
            pretty_quote: z.string(),
            pretty_quote24h: z.string(),
            chain_id: z.number(),
            chain_name: z.string(),
            chain_display_name: z.string(),
        }),
    ),
});
