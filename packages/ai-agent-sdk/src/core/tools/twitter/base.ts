import { Tool } from "../base";
import { TwitterApi, type TwitterApiTokens } from "twitter-api-v2";
import { type AnyZodObject } from "zod";

export interface TwitterToolConfig {
    /**
     * Twitter API Key
     */
    apiKey?: string;

    /**
     * Twitter API Secret
     */
    apiSecret?: string;

    /**
     * Twitter Access Token
     */
    accessToken?: string;

    /**
     * Twitter Access Token Secret
     */
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
            async (parameters) => await this.execute(parameters)
        );

        config.apiKey ||= process.env["TWITTER_API_KEY"];
        config.apiSecret ||= process.env["TWITTER_API_SECRET"];
        config.accessToken ||= process.env["TWITTER_ACCESS_TOKEN"];
        config.accessTokenSecret ||= process.env["TWITTER_ACCESS_TOKEN_SECRET"];

        if (!config.apiKey) {
            throw new Error("TWITTER_API_KEY is not configured.");
        }
        if (!config.apiSecret) {
            throw new Error("TWITTER_API_SECRET is not configured.");
        }
        if (!config.accessToken) {
            throw new Error("TWITTER_ACCESS_TOKEN is not configured.");
        }
        if (!config.accessTokenSecret) {
            throw new Error("TWITTER_ACCESS_TOKEN_SECRET is not configured.");
        }

        this.client = new TwitterApi({
            appKey: config.apiKey,
            appSecret: config.apiSecret,
            accessToken: config.accessToken,
            accessSecret: config.accessTokenSecret,
        } as TwitterApiTokens);
    }
}
