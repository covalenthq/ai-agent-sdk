<div align="center">

# AI Agent SDK for TypeScript

[![GitHub license](https://img.shields.io/github/license/covalenthq/ai-agent-sdk)](https://github.com/covalenthq/ai-agent-sdk/blob/main/LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/covalenthq/ai-agent-sdk)](https://github.com/covalenthq/ai-agent-sdk/commits/master)
[![GitHub contributors](https://img.shields.io/github/contributors/covalenthq/ai-agent-sdk)](https://github.com/covalenthq/ai-agent-sdk/graphs/contributors)
[![GitHub issues](https://img.shields.io/github/issues/covalenthq/ai-agent-sdk)](https://github.com/covalenthq/ai-agent-sdk/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/covalenthq/ai-agent-sdk)](https://github.com/covalenthq/ai-agent-sdk/pulls)
[![GitHub stars](https://img.shields.io/github/stars/covalenthq/ai-agent-sdk)](https://github.com/covalenthq/ai-agent-sdk/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/covalenthq/ai-agent-sdk)](https://github.com/covalenthq/ai-agent-sdk/network/members)

</div>

<p>A TypeScript SDK to build, deploy and interact with AI agents. Create intelligent, context-aware agents with unprecedented ease and functionality.</p>

## Features

Currently available:
* Read onchain data using the [GoldRush API](https://goldrush.dev/)

Roadmap:
* Access offchain and private data
* Train and fine-tune Large/Small Language Models
* Identity services to securely store your agent's private keys
* Communication services to post to social media
* Memory Bank to provide a trustless, verifiable persistent store for critical states, outputs and decisions

## Using the SDK

### 1. Setup and installation

> yarn install

or 

> npm install

### 2. Initialization

```js
import { Agent, BaseChain, GoldRushAPI } from "@covalenthq/ai-agent-sdk";

new Agent({
    onchain: {
        key: "XXX",
        provider: GoldRushAPI
    }
})

```

### 3. Retrieve Token Balances for Wallet on Base Chain

```js
const balances = agent.onchain.getTokenBalancesForWalletAddress(BaseChain, "demo.eth");
```

## 🤝 Contributing

Contributions, issues and feature requests are welcome!
Feel free to check <a href="https://github.com/covalenthq/ai-agent-sdk/issues">issues</a> page.

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

This project is <a href="https://github.com/covalenthq/ai-agent-sdk/blob/main/LICENSE">MIT</a> licensed.
