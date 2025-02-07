import {
    Agent,
    ZeeWorkflow,
    TokenBalancesTool,
    NFTBalancesTool,
    TransactionsTool,
} from "@covalenthq/ai-agent-sdk";
import "dotenv/config";

const tools = {
    tokenBalances: new TokenBalancesTool(process.env.GOLDRUSH_API_KEY),
    nftBalances: new NFTBalancesTool(process.env.GOLDRUSH_API_KEY),
    transactions: new TransactionsTool(process.env.GOLDRUSH_API_KEY),
};

const walletAnalyzer = new Agent({
    name: "WalletAnalyzer",
    model: {
        provider: "OPEN_AI",
        name: "gpt-4o-mini",
    },
    description:
        "An AI assistant that analyzes wallet activities and provides insights about holdings and transactions.",
    instructions: [
        "Analyze wallet token balances and provide insights about holdings",
        "Check NFT collections owned by the wallet",
        "Review recent transactions and identify patterns",
        "Provide comprehensive analysis of the wallet's activity",
    ],
    tools,
});

const zee = new ZeeWorkflow({
    description: "A workflow that analyzes onchain wallet activities",
    output: "Comprehensive analysis of wallet activities including token holdings, NFTs, and transactions",
    agents: { walletAnalyzer },
});

(async function main() {
    const result = await ZeeWorkflow.run(zee);
    console.log(result);
})();
