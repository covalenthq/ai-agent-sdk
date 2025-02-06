import type { AgentConfig, AgentName } from ".";
import { assistant, Base, system, user } from "../base";
import { LLM } from "../llm";
import { StateFn, type ZeeWorkflowState } from "../state";
import type { Tool } from "../tools/base";
import type { ParsedFunctionToolCall } from "openai/resources/beta/chat/completions";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import z, { type AnyZodObject } from "zod";

const getSteps = (conversation: ChatCompletionMessageParam[]) => {
    const messagePairs = conversation.reduce(
        (
            pairs: ChatCompletionMessageParam[][],
            message: ChatCompletionMessageParam,
            index: number
        ) => {
            if (index % 2 === 0) {
                pairs.push([message]);
            } else {
                pairs[pairs.length - 1]?.push(message);
            }
            return pairs;
        },
        []
    );
    return messagePairs.map(([task, result]) =>
        user(`
          <step>
            <name>${task?.content}</name>
            <result>${result?.content}</result>
          </step>
        `)
    );
};

const defaultFn = async (
    agent: Agent,
    state: ZeeWorkflowState
): Promise<ZeeWorkflowState> => {
    const messages = [
        system(`
            ${agent.description}

            Your job is to complete the assigned task:
              - You can break down complex tasks into multiple steps if needed.
              - You can use available tools if needed.
        `),
        assistant("What have been done so far?"),
        user(`Here is all the work done so far by other agents:`),
        ...getSteps(state.messages),
        assistant("Is there anything else I need to know?"),
        user("No, I do not have additional information"),
        assistant("What is the request?"),
        ...state.messages,
    ];

    const schema = {
        step: z.object({
            name: z
                .string()
                .describe("Name of the current step or action being performed"),
            result: z
                .string()
                .describe(
                    "The output of this step. Include all relevant details and information."
                ),
            reasoning: z
                .string()
                .describe("The reasoning for performing this step."),
            next_step: z.string().describe(`
              The next step ONLY if required by the original request.
              Return empty string if you have fully answered the current request, even if
              you can think of additional tasks.
            `),
            has_next_step: z
                .boolean()
                .describe("True if you provided next_step. False otherwise."),
        }),
    };

    const response = await agent.generate(messages, schema);

    if (response.type === "tool_call") {
        return {
            ...state,
            status: "paused",
            messages: [
                ...state.messages,
                {
                    role: "assistant",
                    content: "",
                    tool_calls: response.value as ParsedFunctionToolCall[],
                },
            ],
        };
    }

    const stepResponse = response.value as z.infer<typeof schema.step>;
    const agentResponse = assistant(stepResponse.result);

    if (stepResponse.has_next_step) {
        return {
            ...state,
            status: "running",
            messages: [
                ...state.messages,
                agentResponse,
                user(stepResponse.next_step),
            ],
        };
    }

    const nextState = StateFn.finish(state, agentResponse);

    return nextState;
};

export const router = () =>
    new Agent({
        name: "router",
        description: "You are a router that oversees the workflow.",
        model: {
            provider: "OPEN_AI",
            name: "gpt-4o-mini",
        },

        runFn: async (agent: Agent, state) => {
            const [workflowRequest, ..._messages] = state.messages;

            const messages = [
                system(`
                You are a planner that breaks down complex workflows into smaller, actionable steps.
                Your job is to determine the next task that needs to be done based on the <workflow> and what has been completed so far.

                Rules:
                1. Each task should be self-contained and achievable
                2. Tasks should be specific and actionable
                3. Return null when the workflow is complete
                4. Consider dependencies and order of operations
                5. Use context from completed tasks to inform next steps
              `),
                assistant("What is the request?"),
                workflowRequest!,

                ...(_messages.length > 0
                    ? [
                          assistant("What has been completed so far?"),
                          ...getSteps(_messages),
                      ]
                    : []),

                // ..._messages,
            ];

            const schema = {
                next_task: z.object({
                    task: z
                        .string()
                        .describe(
                            "The next task to be completed, or empty string if workflow is complete"
                        ),
                    reasoning: z
                        .string()
                        .describe(
                            "The reasoning for selecting the next task or why the workflow is complete"
                        ),
                }),
            };

            const result = await agent.generate(messages, schema);

            console.log("Router result", result);

            try {
                if (result.type !== "next_task") {
                    throw new Error(
                        "Expected next_task response, got " + result.type
                    );
                }

                if (result.value["task"]) {
                    const nextState = StateFn.assign(state, [
                        ["resource_planner", user(result.value["task"])],
                    ]);
                    return nextState;
                }

                return {
                    ...state,
                    status: "finished",
                };
            } catch (error) {
                throw new Error(
                    `Failed to determine next task because "${error}`
                );
            }
        },
    });

export const resource_planner = (agents: Record<AgentName, Agent>) =>
    new Agent({
        name: "resource_planner",
        description: "You are a resource planner.",
        model: {
            provider: "OPEN_AI",
            name: "gpt-4o-mini",
        },
        runFn: async (agent: Agent, state) => {
            const agents_description = Object.entries(agents)
                .map(
                    ([name, agent]) =>
                        `<agent name="${name}">${agent.description}</agent>`
                )
                .join("");

            const messages = [
                system(`
            You are an agent selector that matches tasks to the most capable agent.
            Analyze the task requirements and each agent's capabilities to select the best match.

            Consider:
            1. Required tools and skills
            2. Agent's specialization
            3. Model capabilities
            4. Previous task context if available
              `),
                user(`Here are the available agents:
            <agents>
                ${agents_description}
            </agents>
    `),
                assistant("What is the task?"),
                ...state.messages,
            ];

            const schema = {
                select_agent: z.object({
                    agent: z.enum(Object.keys(agents) as [string, ...string[]]),
                    reasoning: z.string(),
                }),
            };

            const result = await agent.generate(messages, schema);

            if (result.type !== "select_agent") {
                throw new Error(
                    "Expected select_agent response, got " + result.type
                );
            }

            return StateFn.passdown(state, result.value.agent);
        },
    });

export class Agent extends Base {
    private config: AgentConfig;
    private llm: LLM;
    private _tools: Record<AgentName, Tool>;
    constructor(config: AgentConfig) {
        super("agent");
        this.config = config;
        this.llm = new LLM(config.model);
        this._tools = config.tools || {};
    }

    get description() {
        return this.config.description;
    }

    get instructions() {
        return this.config.instructions;
    }

    get tools(): Record<AgentName, Tool> {
        return this._tools;
    }

    async generate<T extends Record<string, AnyZodObject>>(
        messages: ChatCompletionMessageParam[],
        response_schema: T
    ) {
        return this.llm.generate(messages, response_schema, this.tools);
    }

    async run(state: ZeeWorkflowState = StateFn.root(this.description)) {
        return this.config.runFn
            ? this.config.runFn(this, state)
            : defaultFn(this, state);
    }
}
