import type { ZEEDefaultAgents, ZeeWorkflowOptions } from ".";
import { systemMessage, Tool, userMessage } from "../..";
import { Agent } from "../agent";
import { Base } from "../base/base";
import { type CoreMessage } from "ai";
import { z } from "zod";

export class ZeeWorkflow extends Base {
    private _agents: Record<string | ZEEDefaultAgents, Agent>;
    // private config: ZeeWorkflowOptions;
    private messages: CoreMessage[] = [];

    constructor({ agents, description, model, output }: ZeeWorkflowOptions) {
        super("zee");

        this.messages.push(
            systemMessage(
                `You are a router that oversees the workflow. ${description}.`
            ),
            userMessage(output)
        );

        const routerAgent = new Agent({
            name: "router",
            description:
                "You are a router that that decides the best agent to invoke based on the conversation history.",
            instructions: [
                "Route the user's request to the best agent",
                "Select the appropriate agent that can handle the request",
                `The available agent names and descriptions are:
                    ${Object.entries(agents)
                        .map(
                            ([name, agent], i) =>
                                `${i + 1}. ${name}: ${agent.description}`
                        )
                        .join("\n")}
                `,
                `Return the following
                    1. Agent name
                    2. Additional comma separated instructions based on the current message history.

                    Format: 'agent_name::instruction1,instruction2,instruction3'
                `,
                `The conversation history is: ${this.messages.map((m) => m.content).join("\n")}`,
            ],
            model,
        });

        const resourcePlannerAgent = new Agent({
            name: "resource planner",
            description:
                "You are a resource planner that invokes an agent to execute a task.",
            instructions: ["Plan the resources for the workflow"],
            model,
            tools: {
                executeAgent: new Tool({
                    name: "executeAgent",
                    description: "Execute a generate from an agent",
                    parameters: z.object({
                        agentName: z.string(),
                        instructions: z.array(z.string()),
                    }),
                    execute: async ({ agentName, instructions }) => {
                        return this.getAgent(agentName).generate({
                            messages: instructions.map((i) => userMessage(i)),
                        });
                    },
                    provider: model.provider,
                }),
            },
        });

        // const endgameAgent = new Agent({
        //     name: "endgame",
        //     description: "You are the endgame agent.",
        //     instructions: [
        //         "Finish the workflow",
        //         "Compile all the data into a final answer",
        //     ],
        //     model,
        // });

        this._agents = {
            router: routerAgent,
            resourcePlanner: resourcePlannerAgent,
            // endgame: endgameAgent,
            ...agents,
        };

        // this.config = {
        //     ...options,
        //     maxIterations:
        //         maxIterations && maxIterations > 0 ? maxIterations : 50,
        // };
    }

    private getAgent(agentName: string): Agent {
        const maybeAgent = this._agents[agentName];
        if (maybeAgent) {
            return maybeAgent;
        }

        throw new Error(
            `Agent ${agentName} not found. Available agents: ${Object.keys(this._agents).join(", ")}.`
        );
    }

    // static printState = (state: ZeeWorkflowState, depth = 0) => {
    //     const indent = "  ".repeat(depth);
    //     const arrow = depth > 0 ? "⊢ " : "";
    //     const statusText =
    //         state.children.length > 0
    //             ? ""
    //             : (() => {
    //                   if (
    //                       state.agent === "router" &&
    //                       (state.status === "idle" ||
    //                           state.status === "running")
    //                   ) {
    //                       return "Looking for next task...";
    //                   }

    //                   if (state.agent === "resource_planner") {
    //                       return "Looking for best agent...";
    //                   }

    //                   switch (state.status) {
    //                       case "idle":
    //                       case "running": {
    //                           const lastMessage = state.messages.at(-1);
    //                           return `Working on: ${lastMessage?.content}`;
    //                       }
    //                       case "paused":
    //                           return "Paused";
    //                       case "failed":
    //                           return "Failed";
    //                       case "finished":
    //                           return "Finished";
    //                   }
    //               })();

    //     console.log(
    //         `${indent}${arrow}${state.agent} ${
    //             depth == 0 ? "(" + state.messages.length + ")" : ""
    //         } ${statusText}`
    //     );

    //     state.children.forEach((child) =>
    //         ZeeWorkflow.printState(child, depth + 1)
    //     );
    // };

    // static async iterate(zeeWorkflow: ZeeWorkflow, state: ZeeWorkflowState) {
    //     const nextState = await execute(zeeWorkflow, [], state);

    //     ZeeWorkflow.printState(nextState);

    //     return nextState;
    // }

    public async run() {
        const r = await this.getAgent("router").generate({});

        console.log(r);

        if (!Object.keys(this._agents).includes(r.value)) {
            throw new Error(`Agent ${r.value} not found.`);
        }

        const agent = this._agents[r.value];

        console.log(r);
    }
}

// const execute = async (
//     zeeWorkflow: ZeeWorkflow,
//     context: unknown[],
//     state: ZeeWorkflowState
// ): Promise<ZeeWorkflowState> => {
//     if (state.messages.length > zeeWorkflow.maxIterations) {
//         const endgameState = StateFn.childState({
//             ...state,
//             agent: "endgame",
//             status: "running",
//         });

//         const agent = zeeWorkflow.agent("endgame");
//         try {
//             return await agent.run(endgameState);
//         } catch (error) {
//             return StateFn.finish(
//                 endgameState,
//                 assistant(
//                     error instanceof Error ? error.message : "Unknown error"
//                 )
//             );
//         }
//     }

//     if (state.children.length > 0) {
//         const children = await Promise.all(
//             state.children.map((child) =>
//                 execute(zeeWorkflow, context.concat(state.messages), child)
//             )
//         );
//         if (children.every((child) => child.status === "finished")) {
//             return {
//                 ...state,
//                 messages: [
//                     ...state.messages,
//                     ...children.flatMap((child) => child.messages),
//                 ],
//                 children: [],
//             };
//         }
//         return {
//             ...state,
//             children,
//         };
//     }

//     if (state.status === "paused") {
//         const toolsResponse = await runTools(zeeWorkflow, context, state);

//         return {
//             ...state,
//             status: "running",
//             messages: [...state.messages, ...toolsResponse],
//         };
//     }
//     const agent = zeeWorkflow.agent(state.agent);
//     if (state.status === "running" || state.status === "idle") {
//         try {
//             return agent.run(state);
//         } catch (error) {
//             return StateFn.finish(
//                 state,
//                 assistant(
//                     error instanceof Error ? error.message : "Unknown error"
//                 )
//             );
//         }
//     }

//     return state;
// };
