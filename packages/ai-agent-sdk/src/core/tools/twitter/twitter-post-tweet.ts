import { TwitterTool, type TwitterToolConfig } from "./base";
import { TwitterPostTweetSchema } from "./schemas";
import type { z } from "zod";

export type TwitterPostTweetParams = z.infer<typeof TwitterPostTweetSchema>;

export class TwitterPostTweetTool extends TwitterTool {
    constructor(config?: TwitterToolConfig) {
        super(
            "twitter-post-tweet",
            "Post a tweet to the authenticated Twitter/X account",
            TwitterPostTweetSchema,
            config
        );
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
