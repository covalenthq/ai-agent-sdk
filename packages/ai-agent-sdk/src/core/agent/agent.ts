import type { AgentConfig, AgentGenerateParameters, AgentResponse } from ".";
import { systemMessage } from "../../functions";
import { Base } from "../base";
import { LLM } from "../llm";

export class Agent extends Base {
    private _config: AgentConfig;
    private _llm: LLM;

    constructor(config: AgentConfig) {
        super("agent");
        this._config = config;
        this._llm = new LLM(config.model);
    }

    get description() {
        return this._config.description;
    }

    get instructions() {
        return this._config.instructions;
    }

    async generate(args: AgentGenerateParameters): Promise<AgentResponse> {
        const response = await this._llm.generate(
            {
                ...args,
                tools: this._config.tools,
                messages: [
                    systemMessage(this.description),
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    ...(this.instructions?.map((instruction) =>
                        systemMessage(instruction)
                    ) ?? []),
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    ...(args.messages ?? []),
                ],
            },
            true
        );
        return response as AgentResponse;
    }
}

// const getSteps = (conversation: CoreMessage[]) => {
//     const messagePairs = conversation.reduce(
//         (pairs: CoreMessage[][], message: CoreMessage, index: number) => {
//             if (index % 2 === 0) {
//                 pairs.push([message]);
//             } else {
//                 pairs[pairs.length - 1]?.push(message);
//             }
//             return pairs;
//         },
//         []
//     );
//     return messagePairs.map(([task, result]) =>
//         Base.user(`
//           <step>
//             <name>${task?.content}</name>
//             <result>${result?.content}</result>
//           </step>
//         `)
//     );
// };

// export const router = () =>
//     new Agent({
//         name: "router",
//         description: "You are a router that oversees the workflow.",
//         // model: {
//         //     provider: "OPEN_AI",
//         //     name: "gpt-4o-mini",
//         // },

//         runFn: async (agent: Agent, state) => {
//             const [workflowRequest, ..._messages] = state.messages;

//             const messages = [
//                 Base.system(`
//                 You are a planner that breaks down complex workflows into smaller, actionable steps.
//                 Your job is to determine the next task that needs to be done based on the <workflow> and what has been completed so far.

//                 Rules:
//                 1. Each task should be self-contained and achievable
//                 2. Tasks should be specific and actionable
//                 3. Return null when the workflow is complete
//                 4. Consider dependencies and order of operations
//                 5. Use context from completed tasks to inform next steps
//               `),
//                 Base.assistant("What is the request?"),
//                 workflowRequest!,

//                 ...(_messages.length > 0
//                     ? [
//                           Base.assistant("What has been completed so far?"),
//                           ...getSteps(_messages),
//                       ]
//                     : []),

//                 // ..._messages,
//             ];

//             const schema = {
//                 next_task: z.object({
//                     task: z
//                         .string()
//                         .describe(
//                             "The next task to be completed, or empty string if workflow is complete"
//                         ),
//                     reasoning: z
//                         .string()
//                         .describe(
//                             "The reasoning for selecting the next task or why the workflow is complete"
//                         ),
//                 }),
//             };

//             const result = await agent.generate(messages, schema);

//             console.log("Router result", result);

//             try {
//                 if (result.type !== "next_task") {
//                     throw new Error(
//                         "Expected next_task response, got " + result.type
//                     );
//                 }

//                 if (result.value["task"]) {
//                     const nextState = StateFn.assign(state, [
//                         ["resource_planner", Base.user(result.value["task"])],
//                     ]);
//                     return nextState;
//                 }

//                 return {
//                     ...state,
//                     status: "finished",
//                 };
//             } catch (error) {
//                 throw new Error(
//                     `Failed to determine next task because "${error}`
//                 );
//             }
//         },
//     });

// export const resource_planner = (agents: Record<AgentName, Agent>) =>
//     new Agent({
//         name: "resource_planner",
//         description: "You are a resource planner.",
//         // model: {
//         //     provider: "OPEN_AI",
//         //     name: "gpt-4o-mini",
//         // },
//         runFn: async (agent: Agent, state) => {
//             const agents_description = Object.entries(agents)
//                 .map(
//                     ([name, agent]) =>
//                         `<agent name="${name}">${agent.description}</agent>`
//                 )
//                 .join("");

//             const messages = [
//                 Base.system(`
//             You are an agent selector that matches tasks to the most capable agent.
//             Analyze the task requirements and each agent's capabilities to select the best match.

//             Consider:
//             1. Required tools and skills
//             2. Agent's specialization
//             3. Model capabilities
//             4. Previous task context if available
//               `),
//                 Base.user(`Here are the available agents:
//             <agents>
//                 ${agents_description}
//             </agents>
//     `),
//                 Base.assistant("What is the task?"),
//                 ...state.messages,
//             ];

//             const schema = {
//                 select_agent: z.object({
//                     agent: z.enum(Object.keys(agents) as [string, ...string[]]),
//                     reasoning: z.string(),
//                 }),
//             };

//             const result = await agent.generate(messages, schema);

//             if (result.type !== "select_agent") {
//                 throw new Error(
//                     "Expected select_agent response, got " + result.type
//                 );
//             }

//             return StateFn.passdown(state, result.value.agent);
//         },
//     });
