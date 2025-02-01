import type { AnyZodType } from "../base";

export class Tool {
    private id: string;
    private _schema: AnyZodType;
    private _description: string;

    private _execute: (parameters: any) => Promise<string>;

    constructor(
        id: string,
        description: string,
        schema: AnyZodType,
        execute: (parameters: any) => Promise<string>
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

    execute(parameters: any) {
        return this._execute(parameters);
    }
}

interface ToolOptions {
    id: string;
    description: string;
    schema: AnyZodType;
    execute: (parameters: any) => Promise<string>;
}

export const createTool = (options: ToolOptions) => {
    return new Tool(
        options.id,
        options.description,
        options.schema,
        options.execute
    );
};
