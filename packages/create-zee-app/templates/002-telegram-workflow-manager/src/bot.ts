import { startWorkflow } from "./workflow";
import { openai } from "@ai-sdk/openai";
import { ZeeWorkflow } from "@covalenthq/ai-agent-sdk";
import {
    StateFn,
    ZeeWorkflowState,
} from "@covalenthq/ai-agent-sdk/dist/core/state";
import { generateObject, generateText } from "ai";

const workflows = new Map<string, ZeeWorkflow>();
const workflowsState = new WeakMap<ZeeWorkflow, ZeeWorkflowState>();

async function run(
    zee: ZeeWorkflow,
    messageSender: (response: string) => void
) {
    let state = await ZeeWorkflow.iterate(zee, workflowsState.get(zee)!);
    while (state.status !== "finished") {
        state = await ZeeWorkflow.iterate(zee, state);
        if (!workflowsState.has(zee)) {
            break;
        }
        workflowsState.set(zee, state);
    }

    messageSender(JSON.stringify(state));
    return state;
}

async function killWorkflow(chatId: string) {
    const zee = workflows.get(chatId);
    if (zee) {
        workflowsState.delete(zee);
    }
}

async function summarize(value: string) {
    const response = await generateText({
        model: openai("gpt-3.5-turbo"),
        system: "You are a helpful assistant. Summarize the following text.",
        prompt: value,
    });
    return response.text;
}

async function classifyWorkflowRequest(text: string) {
    // TODO: get something to kill the workflow.
    const { object } = await generateObject({
        model: openai("gpt-3.5-turbo"),
        output: "enum",
        enum: [
            "start-workflow",
            "get-status",
            "kill-workflow",
            "something-else",
        ],
        system:
            "Determine if the user is requesting to start a new workflow, " +
            "get the status of a workflow, kill the current workflow, or " +
            "something else.\n" +
            "\n" +
            "These are what the respective enums represent:\n" +
            "\n" +
            "start-workflow: The user is requesting to start a new workflow.\n" +
            "get-status: The user is requesting the status of a workflow.\n" +
            "kill-workflow: The user is requesting to kill the current workflow.\n" +
            "something-else: The user is requesting something else.",
        prompt: text,
    });
    return object;
}

export async function handleMessage(
    chatId: string,
    text: string,
    messageSender: (response: string) => void
) {
    if (workflows.has(chatId.toString())) {
        switch (await classifyWorkflowRequest(text ?? "")) {
            case "start-workflow":
                messageSender("A workflow is already running.");
                // TODO: perhaps send a button prompt asking the user to
                //   kill the current workflow.
                break;
            case "get-status":
                const workflow = workflows.get(chatId);
                const state = workflowsState.get(workflow!);
                const summary = await summarize(JSON.stringify(state));
                messageSender(summary);
                break;
            case "kill-workflow":
                messageSender("Killing workflow…");
                killWorkflow(chatId.toString());
                messageSender("Workflow should now be killed");
                break;
            case "something-else":
                const response = await generateText({
                    model: openai("gpt-3.5-turbo"),
                    system:
                        "You are a helpful assistant. For the record " +
                        "the user prompted the chatbot something that " +
                        "requested for a worklow, nor to get the " +
                        "current status.\n" +
                        "Just play along",
                    prompt: text,
                });
                messageSender(response.text);
                break;
        }
    } else {
        switch (await classifyWorkflowRequest(text ?? "")) {
            case "start-workflow":
                const zee = startWorkflow();

                workflows.set(chatId, zee);
                const state = StateFn.root(zee.description);
                workflowsState.set(zee, state);

                messageSender("Starting workflow");

                run(zee, messageSender).then((state) => {
                    workflows.delete(chatId.toString());

                    summarize(JSON.stringify(state)).then((summary) => {
                        messageSender(summary);
                    });
                });
                break;
            case "get-status":
                messageSender("No workflow is running.");
                break;
            case "kill-workflow":
                messageSender("No workflow is running.");
                break;
            case "something-else":
                const response = await generateText({
                    model: openai("gpt-3.5-turbo"),
                    system:
                        "You are a helpful assistant. For the record " +
                        "the user prompted the chatbot something that " +
                        "requested for a worklow, nor to get the " +
                        "current status.\n" +
                        "Just play along",
                    prompt: text,
                });
                messageSender(response.text);
                break;
        }
    }
}
