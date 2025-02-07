import type { AgentName } from "../agent";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export type ZeeWorkflowStatus =
    | "idle"
    | "running"
    | "paused"
    | "failed"
    | "finished";

export type ZeeWorkflowStateOptions = {
    agent: AgentName;
    messages: ChatCompletionMessageParam[];
    status?: ZeeWorkflowStatus;
    children?: ZeeWorkflowState[];
};

export type ZeeWorkflowState = Required<ZeeWorkflowStateOptions>;
