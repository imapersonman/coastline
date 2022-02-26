import { CoastlineControl } from "./control"

export class OptionsTree {
    constructor(
        readonly options: [string, () => CoastlineControl][]
    ) {}
}

export const options_tree = (options: [string, () => CoastlineControl][]): OptionsTree => new OptionsTree(options)
export const is_options_tree = (o: unknown): o is OptionsTree => o instanceof OptionsTree

export const display_options_tree = (t: OptionsTree) => ({
    options: t.options.map(([label]) => label)
})