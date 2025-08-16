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
        dependencies?: {
            agentName: string;
            task: string;
        }[];
        isTaskComplete?: boolean;
        attachments?: UserContentAttachments[];
        originalTask?: string;
        originalFrom?: string;
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
    FOLLOWUP = "FOLLOWUP:",
    ANSWER = "ANSWER:",
    COMPLETE = "COMPLETE:",
}

export interface RawTask {
    instructions: string[];
    attachments: UserContentAttachments[];
    dependencies: string[];
}

export interface ZEETask extends Omit<RawTask, "dependencies"> {
    agentName: string;
    dependencies: {
        agentName: string;
        task: string;
    }[];
}
