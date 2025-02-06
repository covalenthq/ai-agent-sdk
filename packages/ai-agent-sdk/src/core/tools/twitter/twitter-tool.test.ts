import { TwitterTool } from "./twitter-tool";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("twitter-api-v2", () => ({
    TwitterApi: vi.fn().mockImplementation(() => ({
        v2: {
            tweet: vi.fn().mockResolvedValue({ data: { id: "123" } }),
            userByUsername: vi.fn().mockResolvedValue({ data: { id: "456" } }),
            userTimeline: vi.fn().mockResolvedValue({
                data: { data: [{ id: "789", text: "test tweet" }] },
            }),
            follow: vi.fn().mockResolvedValue(true),
            unfollow: vi.fn().mockResolvedValue(true),
        },
    })),
}));

describe("TwitterTool", () => {
    beforeEach(() => {
        process.env["TWITTER_API_KEY"] = "test-key";
        process.env["TWITTER_API_SECRET"] = "test-secret";
        process.env["TWITTER_ACCESS_TOKEN"] = "test-token";
        process.env["TWITTER_ACCESS_SECRET"] = "test-access-secret";
        vi.clearAllMocks();
    });

    it("should post a tweet", async () => {
        const twitter = new TwitterTool();
        const result = await twitter.execute({
            operation: "post_tweet",
            tweet_text: "Hello World!",
        });
        expect(result).toContain("Tweet posted successfully");
    });

    it("should get user tweets", async () => {
        const twitter = new TwitterTool();
        const result = await twitter.execute({
            operation: "get_user_tweets",
            username: "test_user",
        });
        expect(result).toBeDefined();
        const tweets = JSON.parse(result);
        expect(tweets).toHaveLength(1);
    });
});
