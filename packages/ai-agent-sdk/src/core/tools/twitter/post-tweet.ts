import { TwitterTool, type TwitterToolConfig } from "./base";
import { TwitterPostTweetSchema } from "./schemas";
import type { z } from "zod";

export type TwitterPostTweetParams = z.infer<typeof TwitterPostTweetSchema>;

export class TwitterPostTweetTool extends TwitterTool {
    constructor(config?: TwitterToolConfig) {
        config = config || {};
        config.apiKey = config.apiKey || process.env["TWITTER_API_KEY"];
        config.apiSecret =
            config.apiSecret || process.env["TWITTER_API_SECRET"];
        config.accessToken =
            config.accessToken || process.env["TWITTER_ACCESS_TOKEN"];
        config.accessTokenSecret =
            config.accessTokenSecret ||
            process.env["TWITTER_ACCESS_TOKEN_SECRET"];

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
        super("post-tweet", "Post a tweet", TwitterPostTweetSchema, config);
    }

    protected async executeOperation(
        params: TwitterPostTweetParams
    ): Promise<string> {
        try {
            const response = await this.client.v2.tweet(params.tweet);
            return `Successfully posted tweet:\n${JSON.stringify(response)}`;
        } catch (error) {
            return `Error in Twitter operation: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
    }
}
