import { Agent } from "@covalenthq/ai-agent-sdk";
import { user } from "@covalenthq/ai-agent-sdk/dist/core/base";
import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import { z } from "zod";

const messageAgent = new Agent({
    name: "Agent1",
    model: {
        provider: "OPEN_AI",
        name: "gpt-4o-mini",
    },
    description: "A helpful AI assistant that can engage in conversation.",
});

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
    polling: true,
});

bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) {
        return;
    }

    const messages = [user(text)];

    messageAgent
        .generate(messages, { response: z.object({ body: z.string() }) })
        .then((response) => {
            if (response.type === "tool_call") {
                return;
            }

            const reply =
                response.value.body || "Sorry, I didn't understand that.";
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
