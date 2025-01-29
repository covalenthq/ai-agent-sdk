import type { AgentName } from "../agent";
import { user } from "../base";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

type ZeeWorkflowStatus = "idle" | "running" | "paused" | "failed" | "finished";

type ZeeWorkflowStateOptions = {
    agent: AgentName;
    messages: ChatCompletionMessageParam[];
    status?: ZeeWorkflowStatus;
    children?: ZeeWorkflowState[];
};

export type ZeeWorkflowState = Required<ZeeWorkflowStateOptions>;

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
                user(
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
        context: [AgentName, ChatCompletionMessageParam][]
    ): ZeeWorkflowState => {
        return {
            ...state,
            status: "running",
            children: context.map(([agent, message]) =>
                StateFn.childState({ agent, messages: [message] })
            ),
        };
    },

    finish: (
        state: ZeeWorkflowState,
        agentResponse: ChatCompletionMessageParam
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
