import { Tool } from "../base";
import { TwitterApi, type TwitterApiTokens } from "twitter-api-v2";
import { type AnyZodObject } from "zod";

export interface TwitterToolConfig {
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    accessTokenSecret?: string;
}

export abstract class TwitterTool extends Tool {
    protected client: TwitterApi;

    constructor(
        id: string,
        description: string,
        schema: AnyZodObject,
        config: TwitterToolConfig = {}
    ) {
        super(
            id,
            description,
            schema,
            async (parameters) => await this.executeOperation(parameters)
        );

        // Process config after super
        const apiKey = config.apiKey ?? process.env["TWITTER_API_KEY"];
        const apiSecret = config.apiSecret ?? process.env["TWITTER_API_SECRET"];
        const accessToken =
            config.accessToken ?? process.env["TWITTER_ACCESS_TOKEN"];
        const accessTokenSecret =
            config.accessTokenSecret ??
            process.env["TWITTER_ACCESS_TOKEN_SECRET"];

        if (!apiKey) throw new Error("TWITTER_API_KEY is not configured.");
        if (!apiSecret)
            throw new Error("TWITTER_API_SECRET is not configured.");
        if (!accessToken)
            throw new Error("TWITTER_ACCESS_TOKEN is not configured.");
        if (!accessTokenSecret)
            throw new Error("TWITTER_ACCESS_TOKEN_SECRET is not configured.");

        // Initialize client after validation
        this.client = new TwitterApi({
            appKey: apiKey,
            appSecret: apiSecret,
            accessToken: accessToken,
            accessSecret: accessTokenSecret,
        } as TwitterApiTokens);
    }

    protected abstract executeOperation(params: unknown): Promise<string>;
}
