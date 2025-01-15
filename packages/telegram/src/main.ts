import TelegramBot from "node-telegram-bot-api";
import { Command } from "commander";
import OpenAI from "openai";
import { z } from "zod";
import fs from "fs";

export default async function main() {
	console.log("Starting bot...");

	const openai = new OpenAI();

	type History = {
		type: "user" | "agent";
		content: string;
	};

	const chatHistories = new Map<string, History[]>();

	const program = new Command();

	program
		.name("telegram-bot")
		.description("Telegram bot for interacting with the Covalent API")
		.version("1.0.0")
		.option("-t, --token <token>", "Telegram bot token")
		.option("-c, --character <path>", "Path to character configuration file");

	program.parse();

	const BOT_TOKEN = process.env["BOT_TOKEN"];

	const options = program.opts();
	const token = options["token"] || BOT_TOKEN;

	if (!token) {
		throw new Error(
			"Bot token must be provided either through environment variables or --token flag"
		);
	}

	const bot = new TelegramBot(token, { polling: true });

	bot.on("text", (msg) => {
		if (!msg.chat.username || !msg.text) {
			return;
		}
		const history = chatHistories.get(msg.chat.username) ?? [];
		history.push({ type: "user", content: msg.text });
		chatHistories.set(msg.chat.username, history);

		let messages: Parameters<
			typeof openai.chat.completions.create
		>[0]["messages"] = [];

		const character = options["character"];
		if (character) {
			const characterFile = JSON.parse(fs.readFileSync(character, "utf8"));
			if (typeof characterFile.system === "string") {
				messages.push({ role: "system", content: characterFile.system });
			}
		}

		history.forEach((h) => {
			messages.push({
				role: h.type === "user" ? "user" : "assistant",
				content: h.content,
			});
		});

		messages.push({ role: "user", content: msg.text });

		openai.chat.completions
			.create({
				messages,
				model: "gpt-3.5-turbo",
			})
			.then(async (completion) => {
				const response = completion.choices[0]?.message?.content;
				if (response) {
					history.push({ type: "agent", content: response });
					chatHistories.set(msg.chat.username!, history);
					await bot.sendMessage(msg.chat.id, response);
				}
			})
			.catch(async (error) => {
				console.error("Error calling OpenAI:", error);
				await bot.sendMessage(
					msg.chat.id,
					"Sorry, I encountered an error processing your message."
				);
			});
	});

	// Enable graceful stop
	process.once("SIGINT", () => {
		bot.stopPolling();
		process.exit(0);
	});
	process.once("SIGTERM", () => {
		bot.stopPolling();
		process.exit(0);
	});
}
