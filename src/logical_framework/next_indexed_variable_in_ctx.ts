import { GeneratedVariable } from "../lambda_pi/ast"
import { next_indexed_variable } from "../lambda_pi/next_indexed_variable"
import { iv, ov } from "../lambda_pi/shorthands"
import { is_generated_variable } from "../lambda_pi/utilities"
import { is_number } from "../utilities"
import { Ctx } from "./ctx"

export const next_indexed_variable_in_ctx = (ctx: Ctx): GeneratedVariable => {
    const next_index = ctx.entries().reduce<number>((max_so_far, [id, sort]): number => {
        const id_as_var = ov(id).parse()
        const next_in_sort = next_indexed_variable(sort)
        return Math.max(
            is_generated_variable(id_as_var) ? id_as_var.get_index() + 1 : 0,
            next_in_sort.get_index(),
            max_so_far)
    }, 0)
    return iv(next_index)
}