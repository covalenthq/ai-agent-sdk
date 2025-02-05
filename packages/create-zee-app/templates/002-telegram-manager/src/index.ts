import { Agent, ZeeWorkflow } from "@covalenthq/ai-agent-sdk";
import {
	StateFn,
	ZeeWorkflowState,
} from "@covalenthq/ai-agent-sdk/dist/core/state";
import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";

const agent1 = new Agent({
	name: "Agent1",
	model: {
		provider: "OPEN_AI",
		name: "gpt-4o-mini",
	},
	description: "A helpful AI assistant that can engage in conversation.",
});

const agent2 = new Agent({
	name: "Agent2",
	model: {
		provider: "OPEN_AI",
		name: "gpt-4o-mini",
	},
	description: "A helpful AI assistant that can engage in conversation.",
});

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token!, { polling: true });

function cleanup() {
	bot.stopPolling();
	process.exit();
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

const workflows = new Map<string, ZeeWorkflow>();
const workflowsState = new WeakMap<ZeeWorkflow, ZeeWorkflowState>();

async function run(zee: ZeeWorkflow, chatId: number) {
	let state = await ZeeWorkflow.iterate(zee, workflowsState.get(zee)!);
	while (state.status !== "finished") {
		state = await ZeeWorkflow.iterate(zee, state);
		workflowsState.set(zee, state);
	}

	bot.sendMessage(chatId, JSON.stringify(state));
	return state;
}

async function summarize(value: string) {
	const response = await generateText({
		model: openai("gpt-3.5-turbo"),
		system: "You are a helpful assistant. Summarize the following text.",
		prompt: value,
	});
	return response.text;
}

async function classifyWorkflowRequest(text: string) {
	// TODO: get something to kill the workflow.
	const { object } = await generateObject({
		model: openai("gpt-3.5-turbo"),
		output: "enum",
		enum: ["start-workflow", "get-status", "something-else"],
		system:
			"Determine if the user is requesting to start a new workflow, " +
			"get the status of a workflow, or something else.\n" +
			"\n" +
			"These are what the respective enums represent:\n" +
			"\n" +
			"start-workflow: The user is requesting to start a new workflow.\n" +
			"get-status: The user is requesting the status of a workflow.\n" +
			"something-else: The user is requesting something else.",
		prompt: text,
	});
	return object;
}

bot.on("message", (msg) => {
	(async function () {
		const chatId = msg.chat.id;
		if (workflows.has(chatId.toString())) {
			switch (await classifyWorkflowRequest(msg.text ?? "")) {
				case "start-workflow":
					bot.sendMessage(chatId, "A workflow is already running.");
					// TODO: perhaps send a button prompt asking the user to
					//   kill the current workflow.
					break;
				case "get-status":
					const workflow = workflows.get(msg.chat.id.toString());
					const state = workflowsState.get(workflow!);
					const summary = await summarize(JSON.stringify(state));
					bot.sendMessage(chatId, summary);
					break;
				case "something-else":
					const response = await generateText({
						model: openai("gpt-3.5-turbo"),
						system:
							"You are a helpful assistant. For the record " +
							"the user prompted the chatbot something that " +
							"requested for a worklow, nor to get the " +
							"current status.\n" +
							"Just play along",
						prompt: msg.text,
					});
					bot.sendMessage(chatId, response.text);
					break;
			}
		} else {
			const chatId = msg.chat.id;

			switch (await classifyWorkflowRequest(msg.text ?? "")) {
				case "start-workflow":
					const zee = new ZeeWorkflow({
						description: "A workflow of agents that do stuff together",
						output: "Just bunch of stuff",
						agents: { agent1, agent2 },
					});

					workflows.set(msg.chat.id.toString(), zee);
					const state = StateFn.root(zee.description);
					workflowsState.set(zee, state);

					bot.sendMessage(chatId, "Starting workflow");

					run(zee, chatId).then((state) => {
						workflows.delete(chatId.toString());

						summarize(JSON.stringify(state)).then((summary) => {
							bot.sendMessage(chatId, summary);
						});
					});
					break;
				case "get-status":
					bot.sendMessage(chatId, "No workflow is running.");
					break;
				case "something-else":
					const response = await generateText({
						model: openai("gpt-3.5-turbo"),
						system:
							"You are a helpful assistant. For the record " +
							"the user prompted the chatbot something that " +
							"requested for a worklow, nor to get the " +
							"current status.\n" +
							"Just play along",
						prompt: msg.text,
					});
					bot.sendMessage(chatId, response.text);
					break;
			}
		}
	})().catch(console.error);
});
