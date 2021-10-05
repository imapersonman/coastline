import { Ast, GeneratedVariable } from "./ast";
import { iv, ov } from "./shorthands";
import { is_application, is_binder, is_indexed_variable, is_variable } from "./utilities";

export const next_indexed_variable = (ast: Ast): GeneratedVariable => {
    if (is_variable(ast)) {
        const parsed = ov(ast.id).parse()
        if (is_indexed_variable(parsed))
            return iv(parsed.index + 1)
    }
    if (is_application(ast))
        return iv(Math.max(next_indexed_variable(ast.head).index, next_indexed_variable(ast.arg).index))
    if (is_binder(ast))
        return iv(Math.max(next_indexed_variable(ast.bound).index, next_indexed_variable(ast.type).index, next_indexed_variable(ast.scope).index))
    return iv(0)
}