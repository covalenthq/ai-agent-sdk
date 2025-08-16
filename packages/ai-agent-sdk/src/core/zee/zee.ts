import type {
    AgentAction,
    ContextItem,
    RawTask,
    ZEETask,
    ZeeWorkflowOptions,
    ZEEWorkflowResponse,
} from ".";
import { systemMessage, Tool, userMessage, ZEEActionResponseType } from "../..";
import { Agent } from "../agent";
import { Base } from "../base/base";
import { type CoreMessage, type FilePart, type ImagePart } from "ai";
import { z } from "zod";

export class ZeeWorkflow extends Base {
    private agents: Record<string, Agent> = {};
    private defaultAgents: Record<string, Agent> = {};
    private addedAgents: Record<string, Agent> = {};
    private context: ContextItem[] = [];
    private actionQueue: AgentAction[] = [];
    private maxIterations: number = 50;
    private temperature: number = 0.5;
    private goal: string;

    constructor({ agents, model, goal, config }: ZeeWorkflowOptions) {
        super("zee");
        console.log("\n╭────────────────────────────────────────");
        console.log("│ 🚀 Initializing ZeeWorkflow");
        console.log(`│ 🎯 Goal: ${goal}`);
        console.log("╰────────────────────────────────────────");

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

        const plannerAgent = new Agent({
            name: "planner",
            description: `You are a task planner that wants to complete the user's goal - "${goal}".`,
            instructions: [
                "Plan the user's goal into smaller sequential tasks.",
                "Do NOT create a task that is not directly related to the user's goal.",
                "Do NOT create a final compilation task.",
                `Return a JSON array of tasks, where each task has:
                    - instructions: array of instructions for completing the task
                    - attachments: array of attachments items, each being an array of objects with {type: 'image', image: url} or {type: 'file', data: url, mimeType: mimeType}
                    - dependencies: array of strings describing what this task needs from other tasks
                    Example response format:
                    ${JSON.stringify(
                        [
                            {
                                instructions: ["Analyze the logo design"],
                                attachments: [
                                    [
                                        {
                                            type: "image",
                                            image: "https://example.com/logo.png",
                                        },
                                    ],
                                ],
                                dependencies: [],
                            },
                            {
                                instructions: [
                                    "Write brand guidelines based on logo analysis",
                                ],
                                attachments: [],
                                dependencies: [
                                    "Needs logo analysis to write guidelines",
                                ],
                            },
                        ],
                        null,
                        2
                    )}`,
                "Return ONLY the JSON array, no other text",
            ],
            model,
            temperature: this.temperature,
        });

        const routerAgent = new Agent({
            name: "router",
            description:
                "You coordinate information flow between agents and assign tasks to achieve the user's goal.",
            instructions: [],
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
                                `Agent '${agentName}' not found. Available agents: '${Object.keys(this.addedAgents).join("', '")}'.`
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

        [plannerAgent, routerAgent, endgameAgent].forEach((agent) => {
            if (!this.defaultAgents[agent.name]) {
                this.defaultAgents[agent.name] = agent;
            } else {
                throw new Error(`Agent '${agent.name}' already exists`);
            }
        });

        agents.forEach((agent) => {
            if (!this.addedAgents[agent.name]) {
                this.addedAgents[agent.name] = agent;
            } else {
                throw new Error(`Agent '${agent.name}' already exists`);
            }
        });

        [
            ...Object.values(this.defaultAgents),
            ...Object.values(this.addedAgents),
        ].forEach((agent) => {
            if (!this.agents[agent.name]) {
                this.agents[agent.name] = agent;
            } else {
                throw new Error(`Agent '${agent.name}' already exists`);
            }
        });
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

    private parseTasks(response: string): ZEETask[] {
        console.log("\n📝 Parsed Tasks");

        try {
            const tasks = JSON.parse(response) as ZEETask[];

            if (!Array.isArray(tasks)) {
                throw new Error("'planner' response must be an array");
            }

            console.log(`\n🔍 Found ${tasks.length} tasks to process\n`);

            tasks.forEach((task, index) => {
                if (!task.agentName || !Array.isArray(task.instructions)) {
                    throw new Error(`Invalid task format at index ${index}`);
                }

                console.log(`\n╭────────────────────────────────────────`);
                console.log(
                    `│ 📋 TASK ${index + 1} of ${tasks.length}: Assigned to '${task.agentName}'`
                );
                console.log(`├────────────────────────────────────────`);

                console.log(`│ 📝 Instructions:`);
                task.instructions.forEach((instruction, i) => {
                    console.log(`│   ${i + 1}. ${instruction}`);
                });

                if (task.dependencies.length) {
                    console.log(`│ 🔄 Dependencies:`);
                    task.dependencies.forEach((dep, i) => {
                        console.log(
                            `│   ${i + 1}. Needs input from '${dep.agentName}': "${dep.task}"`
                        );
                    });
                }

                if (task.attachments.length) {
                    console.log(`│ 📎 Attachments:`);
                    task.attachments.forEach((items, i) => {
                        items.forEach((item, j) => {
                            const typeStr = item.type;
                            const contentStr =
                                (item as ImagePart).image ||
                                (item as FilePart).data;
                            const contentPreview = String(contentStr).substring(
                                0,
                                60
                            );
                            console.log(
                                `│   ${i + 1}.${j + 1} ${typeStr}: ${contentPreview}${String(contentStr).length > 60 ? "..." : ""}`
                            );
                        });
                    });
                }

                console.log(`╰────────────────────────────────────────`);

                if (task.attachments && !Array.isArray(task.attachments)) {
                    throw new Error(
                        `Invalid attachments format at index ${index}`
                    );
                }
            });

            return tasks;
        } catch (error) {
            console.error("\n❌ Error parsing 'planner' response:", error);
            console.log("Raw response:", response);
            throw new Error(
                `Failed to parse 'planner' response: ${error instanceof Error ? error.message : String(error)}`
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

        try {
            const targetAgent = this.getAgent(action.to);

            console.log("\n📦 Current context:", this.context.length);

            const relevantContext: string | null =
                (action.to === "router"
                    ? action.type === "followup"
                        ? this.context
                              .map((ctx) => `${ctx.role}: ${ctx.content}`)
                              .join("\n")
                        : this.context
                              .filter((ctx) => ctx.role !== "user")
                              .map((ctx) => `${ctx.role}: ${ctx.content}`)
                              .join("\n")
                    : this.context
                          .filter(
                              (ctx) =>
                                  (action.metadata?.dependencies || []).some(
                                      (dep) => dep.agentName === ctx.role
                                  ) || ctx.role === "user"
                          )
                          .map((ctx) => `${ctx.role}: ${ctx.content}`)
                          .join("\n")) || null;

            console.log(`\n🔍 Filtered relevant context for '${action.to}'`);
            console.log("\n📤 Sending information:", {
                relevantContext,
                content: action.content,
            });
            console.log(`\n💭 '${action.to}' thinking...`);

            const messages: CoreMessage[] = [];

            if (action.to !== "router") {
                messages.push(
                    systemMessage(
                        `You have to:
                            1. Complete your task by providing an answer ONLY for the 'Current task' from the context.
                            2. If the answer in not in the context, try to avoid asking for more information.
                            3. If you ABSOLUTELY need additional information to complete your task, request more information by asking a question

                            Instructions for responding:
                            - If you need more information, start with "${ZEEActionResponseType.FOLLOWUP}" followed by your question
                            - If this is your answer, start with "${ZEEActionResponseType.COMPLETE}" followed by your response.`
                    )
                );
            } else if (action.type === "followup") {
                messages.push(
                    systemMessage(
                        `You're handling a followup question from an agent who needs more information to complete their task.
                        
                        ${action.metadata?.originalFrom ? `Question from: '${action.metadata.originalFrom}'` : ""}
                        ${action.metadata?.originalTask ? `\nOriginal task: ${action.metadata.originalTask}` : ""}
                        
                        You have access to the COMPLETE context of all previous communications between agents.
                        Use this full context to provide the most accurate and helpful answer.
                        
                        Your job is to provide a direct, helpful answer based on the complete context and your knowledge.
                        Be specific and thorough in your response, as the agent is relying on your expertise.
                        
                        Start your response with "${ZEEActionResponseType.ANSWER}" followed by your answer.
                        Example: "${ZEEActionResponseType.ANSWER} The script should use standard screenplay format."
                        `
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

            this.processAgentResponse(responseContent, action);
        } catch (error) {
            console.error(`\n❌ Error processing action:`, error);

            if (error instanceof Error && error.message.includes("not found")) {
                console.error(
                    `\n❌ Agent '${action.to}' not found. Available agents: ${Object.keys(this.agents).join(", ")}`
                );

                if (action.type === "followup" && action.to !== "router") {
                    console.log(
                        `\n⚠️ Redirecting followup to router instead of invalid agent '${action.to}'`
                    );
                    const redirectAction: AgentAction = {
                        ...action,
                        to: "router",
                        content: `${action.content}\n\nNOTE: This was originally directed to '${action.to}' but that agent doesn't exist. Please handle this followup request.`,
                    };
                    this.actionQueue.unshift(redirectAction);
                    return;
                }
            }

            this.context.push({
                role: "error",
                content: `Error in communication between ${action.from} -> ${action.to}: ${error instanceof Error ? error.message : String(error)}`,
            });
        }
    }

    private processAgentResponse(responseContent: string, action: AgentAction) {
        // * INFO: 1. Agent needs more information
        if (responseContent.startsWith(ZEEActionResponseType.FOLLOWUP)) {
            const infoContent = responseContent
                .replace(ZEEActionResponseType.FOLLOWUP, "")
                .trim();

            console.log(`\n╭────────────────────────────────────────`);
            console.log(`│ ❓ '${action.to}' asked a followup:`);
            console.log(`│ 🔍 "${infoContent}"`);
            console.log(`╰────────────────────────────────────────`);

            const dependencyInfo = action.metadata?.dependencies
                ? `\n\nContext: Agent has dependencies on: ${action.metadata.dependencies.map((d) => d.agentName).join(", ")}`
                : "\n\nContext: Agent has no explicit dependencies";

            const enrichedContent = `${infoContent}${dependencyInfo}`;

            const infoResponse: AgentAction = {
                type: "followup",
                from: action.to!,
                to: "router",
                content: enrichedContent,
                metadata: {
                    originalTask: action.content,
                    originalFrom: action.from,
                },
            };

            this.actionQueue.unshift(infoResponse);

            console.log(
                `\n🔄 Followup chain: '${action.to}' → router → '${action.to}'`
            );
        }

        // * INFO: 2. 'Router' providing an answer to a followup
        else if (action.to === "router" && action.type === "followup") {
            let answerContent = responseContent;

            if (!responseContent.startsWith(ZEEActionResponseType.ANSWER)) {
                console.log(
                    `\n⚠️ 'Router' response missing ${ZEEActionResponseType.ANSWER} prefix, treating as direct answer`
                );
            } else {
                answerContent = responseContent
                    .replace(ZEEActionResponseType.ANSWER, "")
                    .trim();
            }

            console.log(`\n╭────────────────────────────────────────`);
            console.log(`│ 📝 'Router' answered:`);
            console.log(
                `│ 💬 "${answerContent.substring(0, 100)}${answerContent.length > 100 ? "..." : ""}"`
            );
            console.log(`╰────────────────────────────────────────`);

            const answerResponse: AgentAction = {
                type: "response",
                from: "router",
                to: action.from,
                content: answerContent,
                metadata: {
                    isTaskComplete: true,
                },
            };

            if (
                action.metadata?.originalFrom &&
                action.metadata?.originalTask
            ) {
                const originalQuestion =
                    action.content?.split("\n\nContext:")?.[0]?.trim() ||
                    "details about characters";

                const originalTask: AgentAction = {
                    type: "request",
                    from: "router",
                    to: action.from,
                    content: `${action.metadata.originalTask}\n\nYou previously asked: "${originalQuestion}"\n\nAnswer from router: ${answerContent}\n\nPlease complete your task with this information.`,
                    metadata: {
                        dependencies: action.metadata.dependencies,
                        attachments: action.metadata.attachments,
                    },
                };
                this.actionQueue.unshift(originalTask);
            }

            this.actionQueue.unshift(answerResponse);

            console.log(`\n🔄 Answer being sent: 'router' → '${action.from}'`);
        }

        // * INFO 3. Agent completed its task
        else if (responseContent.startsWith(ZEEActionResponseType.COMPLETE)) {
            const completeContent = responseContent
                .replace(ZEEActionResponseType.COMPLETE, "")
                .trim();

            console.log(`\n╭────────────────────────────────────────`);
            console.log(`│ ✅ '${action.to}' completed task:`);
            console.log(`╰────────────────────────────────────────`);

            const completeAction: AgentAction = {
                type: "complete",
                from: action.to!,
                to: action.from,
                content: completeContent,
                metadata: {
                    isTaskComplete: true,
                },
            };
            this.actionQueue.unshift(completeAction);
        }

        // * INFO 4. Handle unformatted responses gracefully
        else {
            console.log(`\n╭────────────────────────────────────────`);
            console.log(
                `│ ⚠️ Response from '${action.to}' doesn't use expected format:`
            );
            console.log(
                `│ 🔍 "${responseContent.substring(0, 100)}${responseContent.length > 100 ? "..." : ""}"`
            );
            console.log(`│ 📌 Treating as complete response`);
            console.log(`╰────────────────────────────────────────`);

            const completeAction: AgentAction = {
                type: "complete",
                from: action.to!,
                to: action.from,
                content: responseContent,
                metadata: {
                    isTaskComplete: true,
                },
            };
            this.actionQueue.unshift(completeAction);
        }
    }

    public async run(): Promise<ZEEWorkflowResponse> {
        console.log("\n╭────────────────────────────────────────");
        console.log("│ 🎬 Starting workflow execution");
        console.log("╰────────────────────────────────────────");

        console.log("\n📋 Getting tasks from 'planner'...");
        const plannerResponse = await this.getAgent("planner").generate({
            messages: [userMessage(this.goal)],
        });

        const rawTasks = JSON.parse(plannerResponse.value) as RawTask[];

        console.log("\n📋 Assigning agents to tasks via 'router'...");
        const routerResponse = await this.getAgent("router").generate({
            messages: [
                systemMessage(
                    `The available agents are: ${JSON.stringify(
                        Object.values(this.addedAgents).map(
                            ({ name, description, instructions }) => ({
                                name,
                                description,
                                instructions,
                            })
                        )
                    )}
                    For each task:
                    1. Analyze the task requirements
                    2. Select the most suitable agent based on their name, description, and instructions
                    3. Convert the dependencies from string[] to {agentName: string, task: string}[]:
                       - For each dependency, determine which agent should handle it
                       - Create objects with "agentName" and "task" fields instead of string dependencies
                    4. Return a JSON array where each item includes the original task data plus:
                       - agentName: string (the name of the chosen agent)
                       - dependencies: the restructured dependencies array with objects
                    5. Reorder the tasks based on the dependencies for easier processing
                    
                    IMPORTANT: Return ONLY the JSON array, no other text`
                ),
                userMessage(JSON.stringify(rawTasks)),
            ],
        });

        const tasks = this.parseTasks(routerResponse.value);

        tasks.forEach((task) => {
            this.actionQueue.push({
                type: "request",
                from: "router",
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
            const nextAction = this.actionQueue[0];

            console.log("\n╭────────────────────────────────────────");
            console.log(
                `│ 🔄 ITERATION ${iterationCount} of max ${this.maxIterations}`
            );
            console.log(`│ 📊 Queue size: ${this.actionQueue.length} actions`);
            console.log(
                `│ 📑 Next action: ${nextAction?.type} from '${nextAction?.from}' to '${nextAction?.to}'`
            );
            console.log("╰────────────────────────────────────────");

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
            console.log("\n╭────────────────────────────────────────");
            console.log("│ ✨ All agents have completed their tasks");
            console.log("╰────────────────────────────────────────");
        }

        console.log("\n📋 Getting final compilation from endgame agent...");
        const endgameResponse = await this.getAgent("endgame").generate({
            messages: [userMessage(JSON.stringify(this.context))],
        });

        console.log("\n╭────────────────────────────────────────");
        console.log(`│ 🟢 Workflow completed in ${iterationCount} iterations!`);
        console.log("╰────────────────────────────────────────");

        return {
            content: endgameResponse.value,
            context: this.context,
        };
    }
}
