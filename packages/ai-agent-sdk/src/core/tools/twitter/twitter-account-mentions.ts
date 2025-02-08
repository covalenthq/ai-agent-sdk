import { TwitterTool, type TwitterToolConfig } from "./base";
import { TwitterAccountMentionsSchema } from "./schemas";
import type { z } from "zod";

export type TwitterAccountMentionsParams = z.infer<
    typeof TwitterAccountMentionsSchema
>;

export class TwitterAccountMentionsTool extends TwitterTool {
    constructor(config?: TwitterToolConfig) {
        super(
            "twitter-account-mentions",
            "Get account mentions",
            TwitterAccountMentionsSchema,
            config
        );
    }

    protected async executeOperation(
        params: TwitterAccountMentionsParams
    ): Promise<string> {
        try {
            const response = await this.client.v2.userMentionTimeline(
                params.userId
            );
            return `Successfully retrieved account mentions:\n${JSON.stringify(response)}`;
        } catch (error) {
            return `Error in Twitter operation: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
    }
}
