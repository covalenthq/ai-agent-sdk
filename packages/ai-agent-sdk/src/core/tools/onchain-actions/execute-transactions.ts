import { Tool } from "../base";
import { ethers } from "ethers";
import { z } from "zod";

export const ExecuteTransactionSchema = z.object({
    rpcUrl: z.string().describe("The RPC URL for the network"),
    to: z.string().describe("The recipient address"),
    value: z.string().describe("The amount to send in wei"),
});

export type ExecuteTransactionParams = z.infer<typeof ExecuteTransactionSchema>;

export class ExecuteTransactionTool extends Tool {
    private readonly privateKey: string;

    constructor(privateKey: string) {
        if (!privateKey) {
            throw new Error("Private key is required");
        }

        super(
            "evm-transaction",
            "Execute EVM transactions using a private key",
            ExecuteTransactionSchema,
            async (parameters) =>
                await this.executeTransaction(
                    parameters as ExecuteTransactionParams
                )
        );

        this.privateKey = privateKey;
    }

    private async executeTransaction(
        params: ExecuteTransactionParams
    ): Promise<string> {
        try {
            const provider = new ethers.providers.JsonRpcProvider(
                params.rpcUrl
            );
            const wallet = new ethers.Wallet(this.privateKey, provider);

            const tx: ethers.providers.TransactionRequest = {
                to: params.to,
                value: ethers.BigNumber.from(params.value),
            };

            const transaction = await wallet.sendTransaction(tx);
            const receipt = await transaction.wait();

            return JSON.stringify({
                status: "success",
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                effectiveGasPrice: receipt.effectiveGasPrice.toString(),
            });
        } catch (error) {
            return JSON.stringify({
                status: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }
}
