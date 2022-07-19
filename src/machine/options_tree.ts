import { defined } from "../utilities"
import { CoastlineControl } from "./control"
import { ObjectValueMap } from "./object"
import { ErrorValueMap } from './error'

export class OptionsTree<OVM extends ObjectValueMap, EVM extends ErrorValueMap> {
    constructor(
        readonly options: [string, () => CoastlineControl<OVM, EVM>][]
    ) {}
}

export const options_tree = <OVM extends ObjectValueMap, EVM extends ErrorValueMap>(options: [string, () => CoastlineControl<OVM, EVM>][]): OptionsTree<OVM, EVM> => new OptionsTree(options)
export const is_options_tree = <OVM extends ObjectValueMap, EVM extends ErrorValueMap>(o: unknown): o is OptionsTree<OVM, EVM> => o instanceof OptionsTree

export const display_options_tree = <OVM extends ObjectValueMap, EVM extends ErrorValueMap>(t: OptionsTree<OVM, EVM>) => ({
    options: t.options.map(([label]) => label)
})

export const path_from_options_tree = <OVM extends ObjectValueMap, EVM extends ErrorValueMap>(options_tree: OptionsTree<OVM, EVM>, path_label: string): CoastlineControl<OVM, EVM> | undefined => {
    const found_path_pair = options_tree.options.find(([label]) => path_label === label)
    if (!defined(found_path_pair))
        return undefined
    return found_path_pair[1]()
}

