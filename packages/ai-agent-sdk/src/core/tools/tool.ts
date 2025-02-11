import type { AnyZodObject } from "zod";

export class Tool {
    private id: string;
    private _schema: AnyZodObject;
    private _description: string;
    private _execute: (parameters: unknown) => Promise<unknown>;

    constructor(
        id: string,
        description: string,
        schema: AnyZodObject,
        execute: (parameters: unknown) => Promise<unknown>
    ) {
        this.id = id;
        this._description = description;
        this._schema = schema;
        this._execute = execute;
    }

    get description() {
        return this._description;
    }

    get schema() {
        return this._schema;
    }

    async execute(parameters: unknown) {
        const result = await this._execute(parameters);
        return typeof result === "string" ? result : JSON.stringify(result);
    }
}
