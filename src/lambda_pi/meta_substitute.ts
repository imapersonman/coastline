import { Application, Ast, MetaVariable } from "./ast";
import { differentiate } from "./free_variables";
import { apply_permutation_to_ast } from "./permutation";
import { binder_of_same_class } from "./substitute";
import { syntactic_equality } from "./syntactic_equality";
import { is_suspension } from "./utilities";

// I need to add a case for substituting into a suspension.
// - Koissi, 3/26/2022.

export function meta_substitute(meta_var: MetaVariable, with_ast: Ast, in_ast: Ast): Ast {
    if (syntactic_equality(meta_var, in_ast))
        return with_ast
    if (is_suspension(in_ast))
        return apply_permutation_to_ast(in_ast.permutation, meta_substitute(meta_var, with_ast, in_ast.meta_variable))
    return differentiate(in_ast,
        (v) => v,
        () => in_ast,
        (b, t, s) => binder_of_same_class(in_ast, b,
            meta_substitute(meta_var, with_ast, t),
            meta_substitute(meta_var, with_ast, s)),
        (h, a) => new Application(
            meta_substitute(meta_var, with_ast, h),
            meta_substitute(meta_var, with_ast, a)))
}