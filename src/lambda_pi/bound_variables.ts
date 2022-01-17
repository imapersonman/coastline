import { Ast, Variable } from "./ast";
import { is_application, is_binder } from "./utilities";

export const bound_variables = (ast: Ast): Variable[] => {
    if (is_binder(ast))
        return [...new Set([ast.bound, ...bound_variables(ast.type), ...bound_variables(ast.scope)])]
    if (is_application(ast))
        return [...new Set([...bound_variables(ast.head), ...bound_variables(ast.arg)])]
    return []
}