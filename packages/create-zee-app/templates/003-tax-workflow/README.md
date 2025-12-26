# Your AI Agent - Onchain Workflow

This template demonstrates how to create AI agents that can analyze blockchain data using the GoldRush API tools. It showcases various capabilities like analyzing token balances, NFT holdings, and transaction history across multiple blockchains.

## Features

- Token balance analysis across supported blockchains
- NFT holdings tracking with metadata
- Transaction history monitoring
- Historical token price analysis
- Multi-agent workflow coordination

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory with your API keys:

```bash
OPENAI_API_KEY=your_openai_api_key
GOLDRUSH_API_KEY=your_goldrush_api_key
```

3. Run the development server:

```bash
npm run dev
```


## Available Tools

### 1. Token Balances Tool
Fetches token balances for any wallet address with:
- Token amounts and USD values
- Token metadata (symbol, decimals, contract address)

### 2. NFT Holdings Tool
Retrieves NFT holdings with:
- Collection information
- Token IDs and ownership details
- Media URLs and metadata

### 3. Transaction History Tool
Analyzes transaction history including:
- Transaction types (transfers, swaps, mints)
- Token movements and values
- Timestamps and block information

### 4. Historical Token Price Tool
Provides historical price data with:
- Price history over customizable timeframes (1h, 24h, 7d, 30d)
- Token prices in USD
- Detailed price data points

## Example Usage

```typescript
import {
    Agent,
    ZeeWorkflow,
    TokenBalancesTool,
    NFTBalancesTool,
    TransactionsTool,
} from "@covalenthq/ai-agent-sdk";

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
    description: "An AI assistant that analyzes wallet activities and provides insights about holdings and transactions.",
    instructions: [
        "Analyze wallet token balances and provide insights about holdings",
        "Check NFT collections owned by the wallet",
        "Review recent transactions and identify patterns",
        "Provide comprehensive analysis of the wallet's activity",
    ],
    tools,
});
```


## License

MIT - See [LICENSE](./LICENSE) file for details.

## Support

For support and discussions, join our [Telegram community](https://t.me/CXT_Agent_SDK).