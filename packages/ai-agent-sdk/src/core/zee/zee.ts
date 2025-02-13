import type {
    AgentMessage,
    ContextItem,
    ZEEDefaultAgents,
    ZeeWorkflowOptions,
    ZEEWorkflowResponse,
} from ".";
import { Tool, userMessage } from "../..";
import { Agent } from "../agent";
import { Base } from "../base/base";
import { z } from "zod";

export class ZeeWorkflow extends Base {
    private agents: Record<string | ZEEDefaultAgents, Agent>;
    private context: ContextItem[] = [];
    private messageQueue: AgentMessage[] = [];
    private completedTasks: Set<string> = new Set();
    private conversationHistory: Map<string, AgentMessage[]> = new Map();
    private maxIterations: number;

    constructor({
        agents,
        model,
        goal,
        maxIterations = 50,
    }: ZeeWorkflowOptions) {
        super("zee");
        console.log("\n🚀 Initializing ZeeWorkflow");
        console.log("Goal:", goal);

        this.maxIterations = maxIterations;

        this.context.push(userMessage(goal));

        const routerAgent = new Agent({
            name: "router",
            description: `You are a router that wants to complete the user's goal - "${goal}".`,
            instructions: [
                "Break down the user's goal into smaller sequential tasks",
                "For every smaller task, select the best agent that can handle the task",
                `The available agents are: ${JSON.stringify(
                    Object.entries(agents).map(
                        ([name, { description, instructions }]) => ({
                            name,
                            description,
                            instructions,
                        })
                    )
                )}`,
                "Return a JSON array of tasks, where each task has:",
                "- agentName: the name of the agent to handle the task",
                "- instructions: array of instructions for the agent",
                "- dependencies: object mapping agent names to why they are needed",
                "Example response format:",
                JSON.stringify(
                    [
                        {
                            agentName: "writer",
                            instructions: ["Write script outline"],
                            dependencies: {},
                        },
                        {
                            agentName: "budgetManager",
                            instructions: ["Create budget breakdown"],
                            dependencies: {
                                writer: "Needs script to estimate budget",
                            },
                        },
                    ],
                    null,
                    2
                ),
                "Return ONLY the JSON array, no other text",
            ],
            model,
        });

        const resourcePlannerAgent = new Agent({
            name: "resource planner",
            description:
                "You coordinate tasks between agents to achieve the user's goal",
            instructions: [
                `Available agents: ${Object.keys(agents).join(", ")}`,
                "When an agent needs information from another agent:",
                "1. First check if the information exists in the context provided",
                "2. If needed, use the executeAgent tool to get information from other agents",
                "3. Do not try to use any other tools besides executeAgent, pass the desired agent's name and the task to execute",
                "Example: executeAgent({ agentName: 'scriptWriter', task: 'Write script' })",
                "The context will contain all completed tasks in format: 'agentName: output'",
            ],
            model,
            tools: {
                executeAgent: new Tool({
                    name: "executeAgent",
                    description: "Execute a task using another agent",
                    parameters: z.object({
                        agentName: z.string(),
                        task: z.string(),
                    }),
                    execute: async ({ agentName, task }) => {
                        return this.getAgent(agentName).generate({
                            messages: [userMessage(task)],
                        });
                    },
                    provider: model.provider,
                }),
            },
        });

        const endgameAgent = new Agent({
            name: "endgame",
            description:
                "You conclude the workflow based on all completed tasks.",
            instructions: [
                "Review all completed tasks and compile a final response",
                "Ensure the response addresses the original goal",
            ],
            model,
        });

        this.agents = {
            router: routerAgent,
            resourcePlanner: resourcePlannerAgent,
            endgame: endgameAgent,
            ...agents,
        };
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

    private generateConversationId(): string {
        return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    private generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    private parseRouterResponse(response: string) {
        console.log("\n📝 Parsing router response");

        try {
            const tasks = JSON.parse(response);

            if (!Array.isArray(tasks)) {
                throw new Error("Router response must be an array");
            }

            tasks.forEach((task, index) => {
                if (!task.agentName || !Array.isArray(task.instructions)) {
                    throw new Error(`Invalid task format at index ${index}`);
                }
                console.log(
                    `\n📌 Parsed task for ${task.agentName}:`,
                    task.instructions
                );
            });

            return tasks;
        } catch (error) {
            console.error("❌ Error parsing router response:", error);
            console.log("Raw response:", response);
            throw new Error(
                `Failed to parse router response: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    private async processMessage(message: AgentMessage) {
        console.log("\n📨 Processing message:", {
            id: message.id,
            type: message.type,
            from: message.from,
            to: message.to,
        });

        // Store message in conversation history
        const conversationId = message.metadata?.conversationId;
        if (!conversationId) {
            throw new Error("Message must have a conversation ID");
        }

        if (!this.conversationHistory.has(conversationId)) {
            this.conversationHistory.set(conversationId, []);
        }
        this.conversationHistory.get(conversationId)!.push(message);

        // Handle completed tasks
        if (message.type === "response" && message.metadata?.isTaskComplete) {
            console.log("\n✅ Task completed by:", message.from);
            console.log("\n📝 Completion content:", message.content);
            this.completedTasks.add(message.from);
            this.context.push({
                role: message.from,
                content: message.content,
            });
            return;
        }

        if (!message.to) {
            console.warn("⚠️ Message has no recipient:", message);
            return;
        }

        const targetAgent = this.getAgent(message.to);

        // If this is resource planner, include ALL completed task outputs
        const relevantContext =
            (message.to === "resourcePlanner"
                ? this.context
                      .filter((ctx) => ctx.role !== "user")
                      .map((ctx) => `${ctx.role}: ${ctx.content}`)
                      .join("\n")
                : this.context
                      .filter((ctx) =>
                          Object.keys(
                              message.metadata?.dependencies || {}
                          ).includes(ctx.role as string)
                      )
                      .map((ctx) => `${ctx.role}: ${ctx.content}`)
                      .join("\n")) || "None";

        console.log("\n📦 Current context:", this.context);
        console.log(
            `\n🔍 Filtered context for ${message.to}:`,
            relevantContext
        );

        // Build conversation context
        const conversationContext = message.metadata?.conversationId
            ? this.conversationHistory
                  .get(message.metadata.conversationId)!
                  .map(
                      (msg) =>
                          `${msg.from} -> ${msg.to || "all"}: ${msg.content}`
                  )
                  .join("\n")
            : "None";

        console.log(`\n💭 ${message.to} thinking...`);
        console.log("\n📤 Sending context:", {
            relevantContext: relevantContext,
            conversationContext: conversationContext,
            message: message.content,
        });

        const response = await targetAgent.generate({
            messages: [
                userMessage(
                    `${relevantContext}
                    ${conversationContext ? "\nPrevious conversation:\n" + conversationContext : ""}
                    \nNew message from ${message.from}: ${message.content}
                    \nYou can:
                    1. Complete your task by providing a final answer
                    2. Request more information by asking a question
                    \nIf possible, provide a final answer. If you ABSOLUTELY need more information, start your response with "NEED_INFO:" followed by your question.
                    If this is your final answer, start with "COMPLETE:" followed by your response.`
                ),
            ],
        });

        const responseContent = response.value;
        const newMessageId = this.generateMessageId();

        if (responseContent.startsWith("NEED_INFO:")) {
            console.log(
                `❓ ${message.to} needs more information from ${message.from}: ${responseContent.replace("NEED_INFO:", "").trim()}`
            );
            this.messageQueue.unshift({
                id: newMessageId,
                type: "followup",
                from: message.to!,
                to: message.from,
                content: responseContent.replace("NEED_INFO:", "").trim(),
                metadata: {
                    conversationId: conversationId,
                    previousMessageId: message.id,
                },
            });
        } else if (responseContent.startsWith("COMPLETE:")) {
            this.messageQueue.unshift({
                id: newMessageId,
                type: "response",
                from: message.to!,
                to: message.from,
                content: responseContent.replace("COMPLETE:", "").trim(),
                metadata: {
                    conversationId: conversationId,
                    previousMessageId: message.id,
                    isTaskComplete: true, // Mark as task completion
                },
            });
        } else {
            console.log(
                `✍️ ${message.to} responded to followup from ${message.from}: ${responseContent}`
            );
            this.messageQueue.push({
                id: newMessageId,
                type: "followup_response",
                from: message.to!,
                to: message.from,
                content: responseContent,
                metadata: {
                    conversationId: conversationId,
                    previousMessageId: message.id,
                },
            });
        }
    }

    public async run(): Promise<ZEEWorkflowResponse> {
        console.log("\n🎬 Starting workflow execution");

        // Initialize with router's task breakdown
        console.log("\n📋 Getting task breakdown from router...");
        const routerResponse = await this.getAgent("router").generate({});

        const tasks = this.parseRouterResponse(routerResponse.value);

        // Create initial messages for each agent with unique conversation IDs
        tasks.forEach((task) => {
            const messageId = this.generateMessageId();
            const conversationId = this.generateConversationId();

            this.messageQueue.push({
                id: messageId,
                type: "request",
                from: "resourcePlanner",
                to: task.agentName,
                content: task.instructions.join("\n"),
                metadata: {
                    conversationId: conversationId,
                    dependencies: task.dependencies, // Add dependencies from router's response
                },
            });
        });

        // Process message queue until all agents complete their tasks
        let iterationCount = 0;
        while (
            this.messageQueue.length > 0 &&
            iterationCount < this.maxIterations
        ) {
            iterationCount++;
            console.log(
                `\n🔄 Iteration ${iterationCount}\nQueue size: ${this.messageQueue.length}\nNext message: ${this.messageQueue[0]?.type} from ${this.messageQueue[0]?.from} to ${this.messageQueue[0]?.to}`
            );

            const message = this.messageQueue.shift()!;

            try {
                await this.processMessage(message);
            } catch (error) {
                console.error(
                    `❌ Error processing message from ${message.from}:`,
                    error
                );
                this.context.push({
                    role: "error",
                    content: `Error in communication between ${message.from} -> ${message.to}: ${error instanceof Error ? error.message : String(error)}`,
                });
            }

            // Check if all agents have completed their tasks
            const allAgentsComplete = tasks.every((task) =>
                this.completedTasks.has(task.agentName)
            );

            if (allAgentsComplete) {
                console.log("\n✨ All agents have completed their tasks");
                break;
            }
        }

        if (iterationCount >= this.maxIterations) {
            console.warn("⚠️ Reached maximum iterations limit");
        }

        // Final compilation by endgame agent
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
