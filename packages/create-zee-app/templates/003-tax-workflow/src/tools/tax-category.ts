import { createTool } from "@covalenthq/ai-agent-sdk";
import { z } from "zod";

export const taxCategoryTool = createTool({
    id: "tax-category",
    description:
        "Classify transaction type for tax purposes and calculate tax implications according to Indian tax laws",
    schema: z.object({
        category: z.enum([
            "salary",
            "capital_gains_lt",
            "capital_gains_st",
            "business_income",
            "other",
        ]),
        amount: z.number(),
        description: z.string(),
        taxableAmount: z.number(),
    }),
    execute: async (args) => {
        const calculateTax = (income: number): number => {
            if (income <= 300000) return 0;
            if (income <= 600000) return (income - 300000) * 0.05;
            if (income <= 900000) return 15000 + (income - 600000) * 0.1;
            if (income <= 1200000) return 45000 + (income - 900000) * 0.15;
            if (income <= 1500000) return 90000 + (income - 1200000) * 0.2;
            return 150000 + (income - 1500000) * 0.3;
        };

        const capitalGainsRates = {
            capital_gains_lt: 0.1,
            capital_gains_st: 0.15,
        };

        let taxRate = 0;
        // @ts-ignore
        let taxableAmount = args.taxableAmount || args.amount;
        let taxDue = 0;

        // @ts-ignore
        switch (args.category) {
            case "capital_gains_lt":
            case "capital_gains_st":
                // @ts-ignore
                taxRate = capitalGainsRates[args.category];
                taxDue = taxableAmount * taxRate;
                break;
            default:
                taxDue = calculateTax(taxableAmount);
                taxRate = taxDue / taxableAmount;
                break;
        }

        if (taxableAmount > 5000000 && taxableAmount <= 10000000) {
            taxDue *= 1.1;
        } else if (taxableAmount > 10000000 && taxableAmount <= 20000000) {
            taxDue *= 1.15;
        } else if (taxableAmount > 20000000 && taxableAmount <= 50000000) {
            taxDue *= 1.25;
        } else if (taxableAmount > 50000000) {
            taxDue *= 1.37;
        }

        taxDue *= 1.04;

        return JSON.stringify({
            // @ts-ignore
            category: args.category,
            // @ts-ignore
            amount: args.amount,
            taxRate: taxRate,
            taxableAmount: taxableAmount,
            taxDue: Math.round(taxDue * 100) / 100,
            // @ts-ignore
            description: args.description,
            // @ts-ignore
            holdingPeriod: args.holdingPeriod,
        });
    },
});
