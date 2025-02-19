import type { Agent } from "../agent";
import type { ModelProvider, UserContentAttachments } from "../llm";

export type ZeeWorkflowOptions = {
    goal: string;
    agents: Agent[];
    model: ModelProvider;
    config?: {
        maxIterations?: number;
        temperature?: number;
    };
};

export interface AgentAction {
    type: "request" | "complete" | "followup" | "response";
    from: string;
    to: string;
    content: string;
    metadata?: {
        dependencies?: Record<string, string>;
        isTaskComplete?: boolean;
        attachments?: UserContentAttachments[];
    };
}

export interface ContextItem {
    role: string;
    content: unknown;
}

export interface ZEEWorkflowResponse {
    content: string;
    context: ContextItem[];
}

export enum ZEEActionResponseType {
    NEED_INFO = "NEED_INFO:",
    FOLLOWUP_COMPLETE = "FOLLOWUP_COMPLETE:",
    COMPLETE = "COMPLETE:",
}

export interface ZEETask {
    agentName: string;
    instructions: string[];
    attachments: UserContentAttachments[];
    dependencies: Record<string, string>;
}
