import { OnchainService } from "./services/OnchainService";
import type { OnchainProvider } from "./services/OnchainService";

export { OnchainProvider } from "./services/OnchainService";

export type { ChainName, Currency } from "./services/OnchainService";

/**
 * A powerful interface for retrieving blockchain data, designed specifically
 * for AI agents.
 *
 * The Agent class provides seamless access to onchain data, enabling AI agents
 * to fetch real-time and historical data information tokens, NFTs, and wallet
 * activities across multiple chains. This data can be used for:
 *
 * - Portfolio analysis and tracking
 * - Market intelligence and price monitoring
 * - Wallet behavior analysis
 * - Cross-chain activity monitoring
 *
 * The data is returned in strongly-typed, structured formats that are ideal for
 * AI processing and decision making. All responses are validated against Zod
 * schemas to ensure type safety and data integrity.
 */
export class Agent {
    public OnchainService: OnchainService;

    /**
     * Initializes a new instances of the Agent class.
     *
     * @param options - Configuration options for the Agent
     * @param options.onchain - Onchain data provider configuration
     * @param options.onchain.key - API key for accessing the onchain data
     *      provider
     * @param options.onchain.provider - The onchain data provider to use
     *      (e.g. GoldRushAPI)
     */
    constructor(options: {
        onchain: {
            key: string;
            provider: OnchainProvider;
        };
    }) {
        this.OnchainService = new OnchainService(options);
    }
}
