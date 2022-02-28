import { defined } from "../utilities"
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

export const path_from_options_tree = (options_tree: OptionsTree, path_label: string): CoastlineControl | undefined => {
    const found_path_pair = options_tree.options.find(([label, path_f]) => path_label === label)
    if (!defined(found_path_pair))
        return undefined
    return found_path_pair[1]()
}

