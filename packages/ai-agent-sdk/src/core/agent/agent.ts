import type { AgentConfig, AgentGenerateParameters, AgentResponse } from ".";
import { systemMessage } from "../../functions";
import { Base } from "../base";
import { LLM } from "../llm";
import { type CoreMessage } from "ai";

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
        const _messages = [
            systemMessage(this.description),
            ...(this.instructions?.map(systemMessage) ?? []),
            ...(args.messages ?? []),
        ] as CoreMessage[];

        const response = await this._llm.generate(
            {
                ...args,
                tools: this._config.tools,
                messages: _messages,
                temperature: this._config.temperature,
            },
            true
        );

        return response as AgentResponse;
    }
}
