import {
    getTransactionAnalyzer,
    getAccountant,
    getAuditor,
    getReportGen,
} from "./agent";
import { taxCategoryTool } from "./tools/tax-category";
import {
    ZeeWorkflow,
    TokenBalancesTool,
    TransactionsTool,
} from "@covalenthq/ai-agent-sdk";
import { user } from "@covalenthq/ai-agent-sdk/dist/core/base";
import { StateFn } from "@covalenthq/ai-agent-sdk/dist/core/state";
import "dotenv/config";

const tools = {
    tokenBalances: new TokenBalancesTool(process.env.GOLDRUSH_API_KEY),
    transactions: new TransactionsTool(process.env.GOLDRUSH_API_KEY),
    taxCategory: taxCategoryTool,
};

const taxWorkflow = new ZeeWorkflow({
    description:
        "Comprehensive crypto tax analysis and reporting workflow with the user providing the wallet address and chain",
    output: "Detailed tax report including categorized income, capital gains/losses, and total tax obligations with the user providing the wallet address and chain",
    agents: {
        transactionAnalyzer: getTransactionAnalyzer({
            transactions: tools.transactions,
            taxCategory: tools.taxCategory,
        }),
        accountant: getAccountant({
            tokenBalances: tools.tokenBalances,
            taxCategory: tools.taxCategory,
        }),
        auditor: getAuditor(tools),
        reportGen: getReportGen({}),
    },
    maxIterations: 10,
});

async function analyzeCryptoTaxes(walletAddress: string, chain: string) {
    try {
        const initialState = StateFn.root(taxWorkflow.description);
        initialState.messages.push(
            user(
                `Analyze the transactions for '${walletAddress}' on '${chain}' and provide a detailed tax report.`
            )
        );
        const result = await ZeeWorkflow.run(taxWorkflow, initialState);

        console.log("Tax Analysis Complete:");
        console.log(result);
    } catch (error) {
        console.error("Error in tax analysis:", error);
    }
}

analyzeCryptoTaxes("karanpargal.eth", "eth-mainnet");
