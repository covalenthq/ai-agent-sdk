<div align="center">

# AI Agent SDK for TypeScript

[📖 Documentation](https://cxt.build/) | 
[✍🏻 ZEE Use-cases](https://cxt.build/docs/use-cases/overview)

<br />

[![NPM Version](https://img.shields.io/npm/v/@covalenthq/ai-agent-sdk)](https://www.npmjs.com/package/@covalenthq/ai-agent-sdk)
[![NPM Downloads](https://img.shields.io/npm/dt/@covalenthq/ai-agent-sdk)](https://www.npmjs.com/package/@covalenthq/ai-agent-sdk)
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

> npx @covalenthq/create-zee-app@latest

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
    const result = await ZeeWorkflow.run(zee);
    console.log(result);
})();
```

## 🤝 Contributing

Contributions, issues and feature requests are welcome!
Feel free to check <a href="https://github.com/covalenthq/ai-agent-sdk/issues">issues</a> page.

Or join the [AI Agent SDK Working Group](https://t.me/CXT_Agent_SDK) to get help and discuss the future of the SDK.

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

This project is <a href="https://github.com/covalenthq/ai-agent-sdk/blob/main/LICENSE">MIT</a> licensed.
