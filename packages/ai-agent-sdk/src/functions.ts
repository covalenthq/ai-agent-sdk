import type {
    AssistantContent,
    CoreAssistantMessage,
    CoreSystemMessage,
    CoreUserMessage,
    UserContent,
} from "ai";
import { tool } from "ai";

export const createTool = tool;

export const userMessage = (content: UserContent): CoreUserMessage => {
    return {
        role: "user",
        content,
    };
};

export const assistantMessage = (
    content: AssistantContent
): CoreAssistantMessage => {
    return {
        role: "assistant",
        content,
    };
};

export const systemMessage = (content: string): CoreSystemMessage => {
    return {
        role: "system",
        content,
    };
};
