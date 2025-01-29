import { Agent } from "../../agent";
import { StateFn } from "../../state";
import { NFTBalancesTool } from "./nft-balances";
import { TokenBalancesTool } from "./token-balances";
import { TransactionsTool } from "./transactions";
import { expect, test } from "vitest";
import { z } from "zod";

test("blockchain research agent with goldrush tools", async () => {
    const tokenBalances = new TokenBalancesTool();
    const nftBalances = new NFTBalancesTool();
    const transactions = new TransactionsTool();

    const agent = new Agent({
        name: "blockchain researcher",
        model: {
            provider: "OPEN_AI",
            name: "gpt-4o-mini",
        },
        description:
            "You are a blockchain researcher analyzing wallet activities across different chains.",
        instructions: [
            "Analyze wallet activities using the provided blockchain tools",
            "Summarize token holdings, NFT collections, and recent transactions",
            "Provide insights about the wallet's activity patterns",
        ],
        tools: {
            tokenBalances,
            nftBalances,
            transactions,
        },
    });

    const schema = {
        analysis: z.object({
            wallet_summary: z.string(),
            token_holdings: z.string(),
            nft_holdings: z.string(),
            transaction_patterns: z.string(),
            risk_assessment: z.string(),
        }),
    };

    const state = StateFn.root(agent.description);

    const result = await agent.run(state);
    console.log(result);

    expect(result.messages.length).toBeGreaterThan(0);
    expect(result.status).toEqual("paused");
});
