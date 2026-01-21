import { handleMessage } from "./bot";
import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";

const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(token!, { polling: true });

function cleanup() {
    bot.stopPolling();
    process.exit();
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

bot.on("message", (msg) => {
    handleMessage(msg.chat.id.toString(), msg.text ?? "", (response) => {
        bot.sendMessage(msg.chat.id, response);
    }).catch(console.error);
});
