import { ZeeWorkflow } from ".";
import { Agent } from "../agent";
import { type ModelProvider } from "../llm";
import { NFTBalancesTool, TokenBalancesTool, Tool } from "../tools";
import fetch from "node-fetch";
import { describe, test } from "vitest";
import { z } from "zod";

describe("@ai-agent-sdk/zee", () => {
    const providers: ModelProvider[] = [
        {
            provider: "openai",
            id: "gpt-4o-mini",
        },
        // ! FIX: ZEE is not working with Google models
        // {
        //     provider: "google",
        //     id: "gemini-1.5-flash",
        // },
    ];
    providers.forEach((model) => {
        describe(`${model.provider}::${model.id}`, () => {
            test("workflow with two agents", async () => {
                const scriptWriter = new Agent({
                    name: "script writer",
                    description: "You are an expert screenplay writer...",
                    instructions: [
                        "Write a script outline with 3-5 main characters and key plot points.",
                        "Outline the three-act structure and suggest 2-3 twists.",
                        "Ensure the script aligns with a genre and target audience.",
                    ],
                    model,
                });

                const producer = new Agent({
                    name: "movie producer",
                    description: "Experienced movie producer...",
                    instructions: [
                        "Based on the script outline, plan the cast and crew for the movie.",
                        "Summarize the budget for the movie.",
                        "Provide a synopsis of the movie.",
                    ],
                    model,
                });

                const zee = new ZeeWorkflow({
                    goal: "Plan a scene-by-scene script for a movie that is 10 minutes long and has a happy ending. Create a scene-by-scene budget for the provided script. Suggest a cast and crew for the movie.",
                    agents: [scriptWriter, producer],
                    model,
                    config: {
                        temperature: 1,
                    },
                });

                const result = await zee.run();

                console.log(result);
            });

            test("workflow with agent forced followup", async () => {
                const scriptWriter = new Agent({
                    name: "script writer",
                    description:
                        "You are an expert screenplay writer who creates detailed scripts and character descriptions.",
                    instructions: [
                        "Write a brief script outline with main plot points.",
                        "Only if you are providing the script, then start your script with 'COMPLETE:', else just provide desired response.",
                    ],
                    model,
                });

                const producer = new Agent({
                    name: "movie producer",
                    description:
                        "Experienced movie producer who needs specific character details for casting.",
                    instructions: [
                        "Review the script outline.",
                        "You MUST ask the script writer for detailed character descriptions before making casting decisions.",
                        "Once you have character details, provide casting suggestions and budget breakdown.",
                        "Use 'NEED_INFO:' to ask for character details.",
                        "Start your final plan with 'COMPLETE:'",
                    ],
                    model,
                });

                const zee = new ZeeWorkflow({
                    goal: "Create a 10-minute movie script with matching cast and $500,000 budget breakdown.",
                    agents: [scriptWriter, producer],
                    model,
                });

                const result = await zee.run();

                console.log(result);
            });

            test("workflow with custom tools", async () => {
                const weatherAgent = new Agent({
                    name: "weather agent",
                    model,
                    description:
                        "You provided weather information for a location.",
                    instructions: [
                        "Call the weather tool to get the current weather information for a location.",
                    ],
                    tools: {
                        weather: new Tool({
                            provider: model.provider,
                            name: "weather",
                            description:
                                "Fetch the current weather in a location",
                            parameters: z.object({
                                location: z.string(),
                            }),
                            execute: async ({ location }) => {
                                const response = await fetch(
                                    `https://api.weatherapi.com/v1/current.json?q=${location}&key=88f97127772c41a991095603230604`
                                );
                                const data = await response.json();
                                return data;
                            },
                        }),
                    },
                });

                const analystAgent = new Agent({
                    name: "analyst agent",
                    model,
                    description:
                        "You are an analyst that analyzes weather information.",
                    instructions: [
                        "Analyze and summarize the weather information provided.",
                    ],
                });

                const zee = new ZeeWorkflow({
                    goal: "What's the weather in Delhi? Elaborate on the weather.",
                    agents: [weatherAgent, analystAgent],
                    model,
                });

                const result = await zee.run();

                console.log(result);
            });

            test("workflow with goldrush tools", async () => {
                const nftBalancesAgent = new Agent({
                    name: "nft balances agent",
                    model,
                    description:
                        "You are provide NFT balances for a wallet address for a chain.",
                    instructions: ["Provide the nft holdings"],
                    tools: {
                        nftBalances: new NFTBalancesTool(
                            model.provider,
                            process.env["GOLDRUSH_API_KEY"]!
                        ),
                    },
                });

                const tokenBalancesAgent = new Agent({
                    name: "token balances agent",
                    model,
                    description:
                        "You are provide token balances for a wallet address for a chain.",
                    instructions: ["Provide the token holdings"],
                    tools: {
                        tokenBalances: new TokenBalancesTool(
                            model.provider,
                            process.env["GOLDRUSH_API_KEY"]!
                        ),
                    },
                });

                const analystAgent = new Agent({
                    name: "analyst agent",
                    model,
                    description:
                        "You are an expert blockchain analyst that analyzes wallet activities across different chains.",
                    instructions: [
                        "Analyze and summarize the wallet balances.",
                    ],
                });

                const zee = new ZeeWorkflow({
                    goal: "Whats are the NFT and Token balances of 'karanpargal.eth' on 'eth-mainnet'? Elaborate on the balances.",
                    agents: [
                        nftBalancesAgent,
                        tokenBalancesAgent,
                        analystAgent,
                    ],
                    model,
                });

                const result = await zee.run();

                console.log(result);
            });

            test("exceeding max iterations", async () => {
                const strategist = new Agent({
                    name: "campaign strategist",
                    description:
                        "You are an experienced political campaign strategist who specializes in message development and voter outreach strategies.",
                    instructions: [
                        "Analyze the campaign goal and develop key messaging points.",
                        "Identify target voter demographics.",
                        "Propose specific outreach strategies.",
                    ],
                    model,
                });

                const mediaManager = new Agent({
                    name: "media manager",
                    description:
                        "You are a media and communications expert who transforms campaign strategies into actionable media plans.",
                    instructions: [
                        "Review the campaign strategy.",
                        "Create a detailed media plan including social media, traditional media, and advertising.",
                        "Suggest content themes and timing for different platforms.",
                    ],
                    model,
                });

                const budgetManager = new Agent({
                    name: "budget manager",
                    description:
                        "You are a budget manager who manages the campaign budget.",
                    instructions: [
                        "Review the campaign strategy.",
                        "Create a detailed budget plan for the campaign",
                        "Suggest content themes and timing for different platforms.",
                    ],
                    model,
                });

                const zee = new ZeeWorkflow({
                    goal: "Develop a 30-day local political campaign strategy focusing on environmental policies and community engagement. Include both traditional and digital media approaches. Summarize a budget for the provided campaign strategy.",
                    agents: [strategist, mediaManager, budgetManager],
                    model,
                    config: {
                        maxIterations: 5,
                    },
                });

                const result = await zee.run();

                console.log(result);
            });
        });
    });
});
