import type { AgentName } from "../agent";
import { Base } from "../base";
import type { ZeeWorkflowState, ZeeWorkflowStateOptions } from "./state.types";
import type { CoreMessage } from "ai";

export const StateFn = {
    childState: (options: ZeeWorkflowStateOptions): ZeeWorkflowState => {
        const { agent, messages, status = "idle", children = [] } = options;
        return {
            agent,
            messages,
            status,
            children,
        };
    },

    root: (workflowDescription: string): ZeeWorkflowState => {
        return StateFn.childState({
            agent: "router",
            messages: [
                Base.user(
                    `Here is a description of my workflow: ${workflowDescription}`
                ),
            ],
        });
    },

    passdown: (state: ZeeWorkflowState, agent: AgentName): ZeeWorkflowState => {
        return StateFn.childState({
            agent,
            messages: state.messages,
        });
    },

    assign: (
        state: ZeeWorkflowState,
        context: [AgentName, CoreMessage][]
    ): ZeeWorkflowState => {
        return {
            ...state,
            status: "running",
            children: context.map(([agent, message]) =>
                StateFn.childState({
                    agent,
                    messages: [message],
                })
            ),
        };
    },

    finish: (
        state: ZeeWorkflowState,
        agentResponse: CoreMessage
    ): ZeeWorkflowState => {
        if (state.messages[0]) {
            return {
                ...state,
                status: "finished",
                messages: [state.messages[0], agentResponse],
            };
        }

        throw new Error("No messages found in state");
    },
};
