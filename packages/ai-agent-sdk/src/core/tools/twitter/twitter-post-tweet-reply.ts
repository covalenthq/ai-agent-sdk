import { TwitterTool, type TwitterToolConfig } from "./base";
import { TwitterPostTweetReplySchema } from "./schemas";
import type { z } from "zod";

export type TwitterPostTweetReplyParams = z.infer<
    typeof TwitterPostTweetReplySchema
>;

export class TwitterPostTweetReplyTool extends TwitterTool {
    constructor(config?: TwitterToolConfig) {
        super(
            "post-tweet-reply",
            "Post a tweet reply",
            TwitterPostTweetReplySchema,
            config
        );
    }

    protected async executeOperation(
        params: TwitterPostTweetReplyParams
    ): Promise<string> {
        try {
            const response = await this.client.v2.tweet(params.tweetReply, {
                reply: { in_reply_to_tweet_id: params.tweetId },
            });
            return `Successfully posted tweet:\n${JSON.stringify(response)}`;
        } catch (error) {
            return `Error in Twitter operation: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
    }
}
