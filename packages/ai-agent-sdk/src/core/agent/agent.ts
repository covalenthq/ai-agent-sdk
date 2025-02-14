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

    get name() {
        return this._config.name;
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
                temperature: this._config.temperature,
            },
            true
        );

        return response as AgentResponse;
    }
}
