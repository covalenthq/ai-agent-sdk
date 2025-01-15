import TelegramBot from "node-telegram-bot-api";
import { Command } from "commander";

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
	.option("-t, --token <token>", "Telegram bot token");

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
	bot.sendMessage(msg.chat.id, "Welcome! I am a Telegram bot.");
});

export default async function main() {
	console.log("Starting bot...");

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
