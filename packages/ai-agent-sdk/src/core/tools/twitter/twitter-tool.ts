import { Tool } from "../base";
import {
    TwitterAccountDetailsSchema,
    TwitterAccountMentionsSchema,
    TwitterPostTweetSchema,
    TwitterPostTweetReplySchema,
} from "./schemas";
import { TwitterApi } from "twitter-api-v2";
import { z } from "zod";

export const TwitterToolSchema = z.discriminatedUnion("operation", [
    z
        .object({ operation: z.literal("account_details") })
        .merge(TwitterAccountDetailsSchema),
    z
        .object({ operation: z.literal("account_mentions") })
        .merge(TwitterAccountMentionsSchema),
    z
        .object({ operation: z.literal("post_tweet") })
        .merge(TwitterPostTweetSchema),
    z
        .object({ operation: z.literal("post_tweet_reply") })
        .merge(TwitterPostTweetReplySchema),
]);

export type TwitterToolParams = z.infer<typeof TwitterToolSchema>;

export class TwitterTool extends Tool {
    private client: TwitterApi;

    constructor() {
        super(
            "twitter-tool",
            "Perform Twitter operations",
            TwitterToolSchema,
            async (params) => await this.executeOperation(params)
        );

        const apiKey = process.env["TWITTER_API_KEY"];
        const apiSecret = process.env["TWITTER_API_SECRET"];
        const accessToken = process.env["TWITTER_ACCESS_TOKEN"];
        const accessTokenSecret = process.env["TWITTER_ACCESS_TOKEN_SECRET"];

        if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
            throw new Error("Twitter credentials not configured");
        }

        this.client = new TwitterApi({
            appKey: apiKey,
            appSecret: apiSecret,
            accessToken: accessToken,
            accessSecret: accessTokenSecret,
        });
    }

    private async executeOperation(params: TwitterToolParams): Promise<string> {
        try {
            switch (params.operation) {
                case "post_tweet": {
                    const result = await this.client.v2.tweet(
                        params["tweet_text"]
                    );
                    return `Tweet posted successfully with ID: ${result.data.id}`;
                }

                case "account_details": {
                    const response = await this.client.v2.me();
                    response.data.url = `https://x.com/${response.data.username}`;
                    return `Successfully retrieved authenticated user account details:\n${JSON.stringify(response)}`;
                }

                case "account_mentions": {
                    const mentions = await this.client.v2.userMentionTimeline(
                        params["userId"]
                    );
                    return `Successfully retrieved account mentions:\n${JSON.stringify(mentions)}`;
                }

                case "post_tweet_reply": {
                    const reply = await this.client.v2.tweet(
                        params["tweetReply"],
                        {
                            reply: { in_reply_to_tweet_id: params["tweetId"] },
                        }
                    );
                    return `Successfully posted reply to Twitter:\n${JSON.stringify(reply)}`;
                }
            }
            throw new Error(`Unsupported operation: ${params.operation}`);
        } catch (error) {
            return `Error in Twitter operation: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
    }
}
