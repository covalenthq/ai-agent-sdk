import type { UserContentAttachments } from "./core/llm/llm.types";
import type {
    AssistantContent,
    CoreAssistantMessage,
    CoreSystemMessage,
    CoreUserMessage,
} from "ai";

export const userMessage = (
    content: string | UserContentAttachments
): CoreUserMessage => {
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
