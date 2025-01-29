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

<p>Build autonomous AI agents for the Zero-Employee Enterprise (ZEE). Create intelligent, context-aware agents with unprecedented ease and functionality. The Agent SDK supports single model inference calls to multi-agent systems that use tools. The SDK provides primitives that are designed to be easily composable, extendable and flexible for advanced use cases.</p>

## Features 

- LLMs - a unified interface for all LLMs
- Agents - a single model with a system prompt and a set of tools
- Tools - extend the capabilities of agents with external tools
- ZEE Workflows - compose agents to solve complex problems

## Using the SDK (Quick Start)

### 1. Start with a template

> npx create-zee-app 

This will create a new project with a basic setup.

### 2. Modify the agent 

```js
const agent1 = new Agent({
    name: "Agent1",
    model: {
        provider: "OPEN_AI",
        name: "gpt-4o-mini",
    },
    description: "A helpful AI assistant that can engage in conversation.",
});
```

### 3. Modify the ZEE Workflow

```js
const zee = new ZeeWorkflow({
    description: "A workflow of agents that do stuff together",
    output: "Just bunch of stuff",
    agents: { agent1, agent2 },
});
```

### 4. Run the Zee Workflow

```js
(async function main() {
    const result = await zee.run();
    console.log(result);
})();
```

## 🤝 Contributing

Contributions, issues and feature requests are welcome!
Feel free to check <a href="https://github.com/covalenthq/ai-agent-sdk/issues">issues</a> page.

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

This project is <a href="https://github.com/covalenthq/ai-agent-sdk/blob/main/LICENSE">MIT</a> licensed.
