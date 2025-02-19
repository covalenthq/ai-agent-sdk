import type {
    AgentAction,
    ContextItem,
    ZEETask,
    ZeeWorkflowOptions,
    ZEEWorkflowResponse,
} from ".";
import { ZEEActionResponseType } from ".";
import { systemMessage, Tool, userMessage } from "../..";
import { Agent } from "../agent";
import { Base } from "../base/base";
import { type CoreMessage, type FilePart, type ImagePart } from "ai";
import { z } from "zod";

export class ZeeWorkflow extends Base {
    private agents: Record<string, Agent> = {};
    private context: ContextItem[] = [];
    private actionQueue: AgentAction[] = [];
    private maxIterations: number = 50;
    private temperature: number = 0.5;
    private goal: string;

    constructor({ agents, model, goal, config }: ZeeWorkflowOptions) {
        super("zee");
        console.log("\n🚀 Initializing ZeeWorkflow");
        console.log("Goal:", goal);

        if (config?.maxIterations) {
            this.maxIterations = config.maxIterations;
        }

        if (config?.temperature !== undefined) {
            if (config.temperature >= 0 && config.temperature <= 1) {
                this.temperature = config.temperature;
            } else {
                throw new Error(
                    "Invalid temperature. Must be between 0 and 1."
                );
            }
        }

        this.goal = goal;

        this.context.push(userMessage(goal));

        const breakdownAgent = new Agent({
            name: "breakdown",
            description: `You are a task breakdown agent that wants to complete the user's goal - "${goal}".`,
            instructions: [
                "Break down the user's goal into smaller sequential tasks",
                "For every smaller task, select the best agent that can handle the task",
                "If the task involves analyzing images or files, include them in the attachments",
                `The available agents are: ${JSON.stringify(
                    Object.values(agents).map(
                        ({ name, description, instructions }) => ({
                            name,
                            description,
                            instructions,
                        })
                    )
                )}`,
                "Return a JSON array of tasks, where each task has:",
                "- agentName: the name of the agent to handle the task",
                "- instructions: array of instructions for the agent",
                "- attachments: array of attachments items, each being an array of objects with {type: 'image', image: url} or {type: 'file', data: url, mimeType: mimeType}",
                "- dependencies: object mapping agent names to why they are needed",
                "Example response format:",
                JSON.stringify(
                    [
                        {
                            agentName: "image analyzer",
                            instructions: ["Analyze the logo design"],
                            attachments: [
                                [
                                    {
                                        type: "image",
                                        image: "https://example.com/logo.png",
                                    },
                                ],
                            ],
                            dependencies: {},
                        },
                        {
                            agentName: "writer",
                            instructions: [
                                "Write brand guidelines based on logo analysis",
                            ],
                            attachments: [],
                            dependencies: {
                                "image analyzer":
                                    "Needs logo analysis to write guidelines",
                            },
                        },
                    ],
                    null,
                    2
                ),
                "Return ONLY the JSON array, no other text",
            ],
            model,
            temperature: this.temperature,
        });

        const mastermindAgent = new Agent({
            name: "mastermind",
            description:
                "You coordinate information flow between agents to achieve the user's goal.",
            instructions: [
                `The available agents are: ${JSON.stringify(
                    Object.values(agents).map(
                        ({ name, description, instructions }) => ({
                            name,
                            description,
                            instructions,
                        })
                    )
                )}`,
                "Your ONLY task is to identify and call the right agent to get requested information.",
                "1. Identify which agent has the information",
                "2. Call that agent ONCE using executeAgent",
                "3. Return their response without modification",
                "Do not try to process, validate, or get additional information.",
            ],
            model,
            tools: {
                executeAgent: new Tool({
                    name: "execute agent",
                    description: "Get information from a single agent",
                    parameters: z.object({
                        agentName: z.string(),
                        tasks: z.array(
                            z.union([
                                z.string(),
                                z.array(
                                    z.union([
                                        z.object({
                                            type: z.literal("image"),
                                            image: z.string(),
                                            mimeType: z.string().optional(),
                                        }),
                                        z.object({
                                            type: z.literal("file"),
                                            data: z.string(),
                                            mimeType: z.string(),
                                        }),
                                    ])
                                ),
                            ])
                        ),
                    }),
                    execute: async ({ agentName, tasks }) => {
                        const agent = this.getAgent(agentName);
                        if (!agent) {
                            throw new Error(
                                `Agent '${agentName}' not found. Available agents: '${Object.keys(this.agents).join("', '")}'.`
                            );
                        }

                        const response = await agent.generate({
                            messages: tasks.map(userMessage),
                        });

                        return response.value;
                    },
                    provider: model.provider,
                }),
            },
            temperature: this.temperature,
        });

        const endgameAgent = new Agent({
            name: "endgame",
            description:
                "You conclude the workflow based on all completed tasks.",
            instructions: [
                "Review all completed tasks and compile in a single response.",
                "Ensure the response addresses the original goal.",
            ],
            model,
            temperature: this.temperature,
        });

        [breakdownAgent, mastermindAgent, endgameAgent, ...agents].forEach(
            (agent) => {
                if (!this.agents[agent.name]) {
                    this.agents[agent.name] = agent;
                } else {
                    throw new Error(`Agent '${agent.name}' already exists`);
                }
            }
        );
    }

    private getAgent(agentName: string): Agent {
        const maybeAgent = this.agents[agentName];
        if (maybeAgent) {
            return maybeAgent;
        }

        throw new Error(
            `Agent '${agentName}' not found. Available agents: ${Object.keys(this.agents).join(", ")}.`
        );
    }

    private parseBreakdownResponse(response: string): ZEETask[] {
        console.log("\n📝 Parsing 'breakdown' response");

        try {
            const tasks = JSON.parse(response) as ZEETask[];

            if (!Array.isArray(tasks)) {
                throw new Error("'breakdown' response must be an array");
            }

            tasks.forEach((task, index) => {
                if (!task.agentName || !Array.isArray(task.instructions)) {
                    throw new Error(`Invalid task format at index ${index}`);
                }

                console.log(
                    `\n📌 Task for '${task.agentName}':`,
                    task.instructions,
                    Object.keys(task.dependencies).length
                        ? `\nDependent on: ${Object.entries(task.dependencies)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(", ")}`
                        : "",
                    task.attachments.length
                        ? `\nAttachments provided: ${task.attachments.map(
                              (item) =>
                                  item.map(
                                      (i) =>
                                          `${i.type}: ${(i as ImagePart).image || (i as FilePart).data}`
                                  )
                          )}`
                        : ""
                );

                if (task.attachments && !Array.isArray(task.attachments)) {
                    throw new Error(
                        `Invalid attachments format at index ${index}`
                    );
                }
            });

            return tasks;
        } catch (error) {
            console.error("\n❌ Error parsing 'breakdown' response:", error);
            console.log("Raw response:", response);
            throw new Error(
                `Failed to parse 'breakdown' response: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    private async processActionItem(action: AgentAction) {
        console.log("\n📨 Processing action:", {
            type: action.type,
            from: action.from,
            to: action.to,
        });

        if (action.metadata?.isTaskComplete) {
            switch (action.type) {
                case "complete": {
                    console.log(`\n✅ Task completed by: '${action.from}'`);
                    break;
                }
                case "response": {
                    console.log(
                        `\n☑️ Followup task completed by: '${action.from}'`
                    );
                    break;
                }
            }
            this.context.push({
                role: action.from,
                content: action.content,
            });
            console.log("\n📝 Added to context");

            return;
        }

        const targetAgent = this.getAgent(action.to);

        console.log("\n📦 Current context:", this.context);

        const relevantContext: string | null =
            (action.to === "mastermind"
                ? this.context
                      .filter((ctx) => ctx.role !== "user")
                      .map((ctx) => `${ctx.role}: ${ctx.content}`)
                      .join("\n")
                : this.context
                      .filter(
                          (ctx) =>
                              Object.keys(
                                  action.metadata?.dependencies || {}
                              ).includes(ctx.role as string) ||
                              ctx.role === "user"
                      )
                      .map((ctx) => `${ctx.role}: ${ctx.content}`)
                      .join("\n")) || null;

        console.log(`\n🔍 Filtered relevant context for '${action.to}'`);
        console.log("\n📤 Sending information:", {
            relevantContext: relevantContext,
            content: action.content,
        });
        console.log(`\n💭 '${action.to}' thinking...`);

        const messages: CoreMessage[] = [];

        if (action.to !== "mastermind") {
            messages.push(
                systemMessage(
                    `You have to:
                        1. Complete your task by providing an answer for the current task from the context.
                        2. If the answer in not in the context, try to avoid asking for more information.
                        3. If you ABSOLUTELY need additional information to complete your task, request more information by asking a question

                        Instructions for responding:
                        - If you need more information, start with "${ZEEActionResponseType.NEED_INFO}" followed by your question
                        - If this is your answer, start with "${ZEEActionResponseType.COMPLETE}" followed by your response.`
                )
            );
        } else if (action.type === "followup") {
            messages.push(
                systemMessage(
                    `start your response with "${ZEEActionResponseType.FOLLOWUP_COMPLETE}[agent name]:" followed by the response from the agent. Replace 'agent name' with the name of the agent that is responding.`
                )
            );
        }

        messages.push(
            userMessage(
                `${relevantContext ? `Relevant context -> ${relevantContext}` : ""}
                \nCurrent task -> ${action.content}`
            )
        );

        if (action.metadata?.attachments?.length) {
            messages.push(...action.metadata.attachments.map(userMessage));
        }

        const response = await targetAgent.generate({ messages });

        const responseContent = response.value;

        if (responseContent.startsWith(ZEEActionResponseType.NEED_INFO)) {
            const infoResponse: AgentAction = {
                type: "followup",
                from: action.to!,
                to: "mastermind",
                content: responseContent
                    .replace(ZEEActionResponseType.NEED_INFO, "")
                    .trim(),
            };
            this.actionQueue.unshift(action);
            this.actionQueue.unshift(infoResponse);
            console.log(
                `\n❓ '${action.to}' needs more information`,
                infoResponse.content
            );
        } else if (
            responseContent.startsWith(ZEEActionResponseType.FOLLOWUP_COMPLETE)
        ) {
            const followupCompletePattern = `${ZEEActionResponseType.FOLLOWUP_COMPLETE}\\[(.*?)\\]:\\s*`;
            const match = responseContent.match(followupCompletePattern);
            const agentName = match?.[1]?.trim();

            console.log(
                `\n⚙️ Handling followup response from '${agentName}'`,
                action.to
            );

            if (!agentName) {
                console.error(
                    `\n❌ No agent name - '${agentName}' found in response from '${action.to}'`
                );
                return;
            }

            const followupResponse: AgentAction = {
                type: "response",
                from: agentName,
                to: action.from,
                content: responseContent.replace(match?.[0] || "", "").trim(),
                metadata: {
                    isTaskComplete: true,
                },
            };
            this.actionQueue.unshift(followupResponse);
        } else if (responseContent.startsWith(ZEEActionResponseType.COMPLETE)) {
            const completeAction: AgentAction = {
                type: "complete",
                from: action.to!,
                to: action.from,
                content: responseContent
                    .replace(ZEEActionResponseType.COMPLETE, "")
                    .trim(),
                metadata: {
                    isTaskComplete: true,
                },
            };
            this.actionQueue.unshift(completeAction);
        }
    }

    public async run(): Promise<ZEEWorkflowResponse> {
        console.log("\n🎬 Starting workflow execution");

        console.log("\n📋 Getting task breakdown from 'breakdown'...");
        const breakdownResponse = await this.getAgent("breakdown").generate({
            messages: [userMessage(this.goal)],
        });

        const tasks = this.parseBreakdownResponse(breakdownResponse.value);

        tasks.forEach((task) => {
            this.actionQueue.push({
                type: "request",
                from: "mastermind",
                to: task.agentName,
                content: task.instructions.join("\n"),
                metadata: {
                    dependencies: task.dependencies,
                    attachments: task.attachments,
                },
            });
        });

        let iterationCount = 0;
        while (
            this.actionQueue.length > 0 &&
            iterationCount < this.maxIterations
        ) {
            if (iterationCount >= this.maxIterations) {
                console.warn("\n⚠️ Reached maximum iterations limit");
            }

            iterationCount++;
            console.log(
                `\n🔄 Iteration ${iterationCount}\nQueue size: ${this.actionQueue.length}`,
                `Next action: ${this.actionQueue[0]?.type} from ${this.actionQueue[0]?.from} to ${this.actionQueue[0]?.to}`
            );

            const action = this.actionQueue.shift()!;

            try {
                await this.processActionItem(action);
            } catch (error) {
                console.error(
                    `\n❌ Error processing action from ${action.from}:`,
                    error
                );
                this.context.push({
                    role: "error",
                    content: `Error in communication between ${action.from} -> ${action.to}: ${error instanceof Error ? error.message : String(error)}`,
                });
            }
        }

        if (iterationCount >= this.maxIterations) {
            console.warn("\n⚠️ Reached maximum iterations limit");
        } else {
            console.log("\n✨ All agents have completed their tasks");
        }

        console.log("\n🎭 Getting final compilation from endgame agent...");
        const endgameResponse = await this.getAgent("endgame").generate({
            messages: [userMessage(JSON.stringify(this.context))],
        });

        console.log(
            `\n 🟢 Workflow completed in ${iterationCount} iterations!`
        );

        return {
            content: endgameResponse.value,
            context: this.context,
        };
    }
}
