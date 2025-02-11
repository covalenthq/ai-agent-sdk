import type { AgentName } from "../agent";
import type { CoreMessage } from "ai";

export type ZeeWorkflowStatus =
    | "idle"
    | "running"
    | "paused"
    | "failed"
    | "finished";

export type ZeeWorkflowStateOptions = {
    agent: AgentName;
    messages: CoreMessage[];
    status?: ZeeWorkflowStatus;
    children?: ZeeWorkflowState[];
};

export type ZeeWorkflowState = Required<ZeeWorkflowStateOptions>;
