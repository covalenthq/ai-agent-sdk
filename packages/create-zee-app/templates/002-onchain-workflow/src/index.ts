import {
    Agent,
    type ModelProvider,
    NFTBalancesTool,
    TokenBalancesTool,
    ZeeWorkflow,
} from "@covalenthq/ai-agent-sdk";
import "dotenv/config";

const model: ModelProvider = {
    provider: "openai",
    id: "gpt-4o-mini",
};

const walletAnalyzer = new Agent({
    name: "wallet analyzer",
    model,
    description:
        "An AI assistant that analyzes wallet activities and provides insights about holdings and transactions.",
    instructions: [
        "Analyze wallet token balances and provide insights about holdings",
        "Check NFT collections owned by the wallet",
        "Review recent transactions and identify patterns",
        "Provide comprehensive analysis of the wallet's activity",
    ],
    tools: {
        nftBalances: new NFTBalancesTool(model.provider),
        tokenBalances: new TokenBalancesTool(model.provider),
    },
});

const zee = new ZeeWorkflow({
    goal: "What are the NFT and Token balances of 'demo.eth' on 'eth-mainnet'? Elaborate on the balances.",
    agents: [walletAnalyzer],
    model,
});

(async function main() {
    const result = await zee.run();
    console.log(result);
})();
