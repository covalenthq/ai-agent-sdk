import { Agent } from "@covalenthq/ai-agent-sdk";
import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";

const messageAgent = new Agent({
    name: "Agent1",
    model: {
        provider: "OPEN_AI",
        name: "gpt-4o-mini",
    },
    description: "A helpful AI assistant that can engage in conversation.",
});

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
    polling: true,
});

bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    const messages = [{ role: "user", content: text }];

    messageAgent
        .generate(messages, {})
        .then((response) => {
            const reply =
                response[0]?.content || "Sorry, I didn't understand that.";
            bot.sendMessage(chatId, reply);
        })
        .catch((error) => {
            console.error("Error generating response:", error);
            bot.sendMessage(
                chatId,
                "There was an error processing your request."
            );
        });
});
