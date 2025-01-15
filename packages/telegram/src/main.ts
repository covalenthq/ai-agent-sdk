import TelegramBot from "node-telegram-bot-api";
import { Command } from "commander";

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

bot.onText(/\/start/, (msg) => {
	bot.sendMessage(msg.chat.id, "Welcome! I am a Telegram bot.");
});

bot.on("text", (msg) => {
	bot.sendMessage(msg.chat.id, `You said: ${msg.text}`);
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
