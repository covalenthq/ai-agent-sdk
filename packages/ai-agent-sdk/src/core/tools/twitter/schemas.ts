// schemas.ts
import { z } from "zod";

export const TwitterPostTweetSchema = z.object({
    tweet: z.string().describe("Tweet content (max 280 characters)"),
});

export const TwitterPostTweetReplySchema = z.object({
    tweetId: z.string().describe("ID of the tweet to reply to"),
    tweetReply: z.string().describe("Reply content (max 280 characters)"),
});

export const TwitterAccountDetailsSchema = z
    .object({})
    .describe("No parameters needed for account details");

export const TwitterAccountMentionsSchema = z.object({
    userId: z.string().describe("Twitter user ID to fetch mentions for"),
});
