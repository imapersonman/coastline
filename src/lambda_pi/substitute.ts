import _ from "lodash"
import { AbstractSyntaxTree, Application, Lambda, Pi, Variable } from "./ast"
import { differentiate, free_variables } from "./free_variables"
import { new_variable } from "./new_variable"
import { syntactic_equality } from "./syntactic_equality"
import { ast_in } from "./utilities"

type Ast = AbstractSyntaxTree

export function substitute(sub_v: Variable, with_ast: Ast, in_ast: Ast): Ast {
    if (syntactic_equality(sub_v, with_ast))
        return in_ast
    return differentiate(in_ast,
        (v) => syntactic_equality(v, sub_v) ? with_ast : v,
        () => in_ast,
        (b, t, s) => {
            const mod_t = substitute(sub_v, with_ast, t)
            if (syntactic_equality(b, sub_v))
                return binder_of_same_class(in_ast, b, mod_t, s)
            const mod_b = possibly_rename_bound(b, s, sub_v, with_ast)
            const mod_s = substitute(sub_v, with_ast, substitute(b, mod_b, s))
            return binder_of_same_class(in_ast, mod_b, mod_t, mod_s)
        },
        (h, a) => new Application(
            substitute(sub_v, with_ast, h),
            substitute(sub_v, with_ast, a)))
}

export function binder_of_same_class(binder: Ast, bound: Variable, type: Ast, scope: Ast): Lambda | Pi {
    if (binder instanceof Lambda)
        return new Lambda(bound, type, scope)
    else if (binder instanceof Pi)
        return new Pi(bound, type, scope)
    throw new Error("Given Ast is not a binder")
}

function possibly_rename_bound(bound: Variable, scope: Ast, sub_v: Variable, with_ast: Ast): Variable {
    const v_equals = (v1: Variable, v2: Variable) => syntactic_equality(v1, v2)
    const fv_with = free_variables([], with_ast)
    const fv_s = free_variables([], scope)
    if (ast_in(sub_v, fv_s) && ast_in(bound, fv_with))
        return new_variable(_.unionWith(fv_with, fv_s, v_equals), bound)
    return bound
}
