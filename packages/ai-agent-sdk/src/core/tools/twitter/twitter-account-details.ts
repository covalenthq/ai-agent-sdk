import { TwitterTool, type TwitterToolConfig } from "./base";
import { TwitterAccountDetailsSchema } from "./schemas";
import type { z } from "zod";

export type TwitterAccountDetailsParams = z.infer<
    typeof TwitterAccountDetailsSchema
>;

export class TwitterAccountDetailsTool extends TwitterTool {
    constructor(config?: TwitterToolConfig) {
        super(
            "twitter-account-details",
            "Get account details",
            TwitterAccountDetailsSchema,
            config
        );
    }

    protected async executeOperation(
        _?: TwitterAccountDetailsParams
    ): Promise<string> {
        try {
            const response = await this.client.v2.me();
            response.data.url = `https://x.com/${response.data.username}`;
            return `Successfully retrieved authenticated user account details:\n${JSON.stringify(response)}`;
        } catch (error) {
            return `Error in Twitter operation: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
    }
}
