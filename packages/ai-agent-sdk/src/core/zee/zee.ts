import { type Agent, type AgentName, resource_planner, router } from "../agent";
import { assistant, Base } from "../base";
import { StateFn, type ZeeWorkflowState } from "../state";
import type { ZeeWorkflowOptions } from "./zee.types";
import type { ChatCompletionToolMessageParam } from "openai/resources/chat/completions";

const runTools = async (
    zeeWorkflow: ZeeWorkflow,
    context: unknown,
    state: ZeeWorkflowState
): Promise<ChatCompletionToolMessageParam[]> => {
    const toolCall = state.messages.at(-1);

    if (toolCall && !("tool_calls" in toolCall)) {
        throw new Error("No tool calls found");
    }

    const agent = zeeWorkflow.agent(state.agent);
    const tools = agent.tools;

    const results = await Promise.all(
        toolCall?.tool_calls?.map(async (tc) => {
            if (tc.type !== "function") {
                throw new Error("Tool call needs to be a function");
            }

            const fn = tools[tc.function.name];
            if (!fn) {
                throw new Error(`Tool ${tc.function.name} not found`);
            }

            const args = JSON.parse(tc.function.arguments);
            const fnResult = await fn.execute(args);

            return {
                role: "tool",
                tool_call_id: tc.id,
                content: fnResult,
            } satisfies ChatCompletionToolMessageParam;
        }) ?? []
    );

    return results;
};

const execute = async (
    zeeWorkflow: ZeeWorkflow,
    context: unknown[],
    state: ZeeWorkflowState
): Promise<ZeeWorkflowState> => {
    if (state.messages.length > zeeWorkflow.maxIterations) {
        return StateFn.childState({
            ...state,
            agent: "finalBoss",
        });
    }

    if (state.children.length > 0) {
        const children = await Promise.all(
            state.children.map((child) =>
                execute(zeeWorkflow, context.concat(state.messages), child)
            )
        );
        if (children.every((child) => child.status === "finished")) {
            return {
                ...state,
                messages: [
                    ...state.messages,
                    ...children.flatMap((child) => child.messages),
                ],
                children: [],
            };
        }
        return {
            ...state,
            children,
        };
    }

    if (state.status === "paused") {
        const toolsResponse = await runTools(zeeWorkflow, context, state);

        return {
            ...state,
            status: "running",
            messages: [...state.messages, ...toolsResponse],
        };
    }
    const agent = zeeWorkflow.agent(state.agent);
    if (state.status === "running" || state.status === "idle") {
        try {
            return agent.run(state);
        } catch (error) {
            return StateFn.finish(
                state,
                assistant(
                    error instanceof Error ? error.message : "Unknown error"
                )
            );
        }
    }

    return state;
};

export class ZeeWorkflow extends Base {
    private _agents: Record<AgentName, Agent>;
    private config: ZeeWorkflowOptions;

    constructor(options: ZeeWorkflowOptions) {
        super("zee");

        this._agents = {
            router: router(),
            resource_planner: resource_planner(options.agents),
            ...options.agents,
        };

        this.config = options;
    }

    get description() {
        return this.config.description;
    }

    get output() {
        return this.config.output;
    }

    get maxIterations() {
        return this.config.maxIterations ?? 50;
    }

    agent(agentName: string): Agent {
        const maybeAgent = this._agents[agentName];
        if (maybeAgent) {
            return maybeAgent;
        }

        throw new Error(`Agent ${agentName} not found`);
    }

    static printState = (state: ZeeWorkflowState, depth = 0) => {
        const indent = "  ".repeat(depth);
        const arrow = depth > 0 ? "⊢ " : "";
        const statusText =
            state.children.length > 0
                ? ""
                : (() => {
                      if (
                          state.agent === "router" &&
                          (state.status === "idle" ||
                              state.status === "running")
                      ) {
                          return "Looking for next task...";
                      }

                      if (state.agent === "resource_planner") {
                          return "Looking for best agent...";
                      }

                      switch (state.status) {
                          case "idle":
                          case "running": {
                              const lastMessage = state.messages.at(-1);
                              return `Working on: ${lastMessage?.content}`;
                          }
                          case "paused":
                              return "Paused";
                          case "failed":
                              return "Failed";
                          case "finished":
                              return "Finished";
                      }
                  })();

        console.log(
            `${indent}${arrow}${state.agent} ${
                depth == 0 ? "(" + state.messages.length + ")" : ""
            } ${statusText}`
        );

        state.children.forEach((child) =>
            ZeeWorkflow.printState(child, depth + 1)
        );
    };

    static async iterate(zeeWorkflow: ZeeWorkflow, state: ZeeWorkflowState) {
        const nextState = await execute(zeeWorkflow, [], state);

        ZeeWorkflow.printState(nextState);

        return nextState;
    }

    static async run(
        zeeWorkflow: ZeeWorkflow,
        state: ZeeWorkflowState = StateFn.root(zeeWorkflow.description)
    ): Promise<ZeeWorkflowState> {
        if (state.status === "finished") {
            return state;
        }

        return ZeeWorkflow.run(
            zeeWorkflow,
            await ZeeWorkflow.iterate(zeeWorkflow, state)
        );
    }
}
