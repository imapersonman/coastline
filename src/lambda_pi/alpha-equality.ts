import _ from "lodash";
import { AbstractSyntaxTree, Application, Constant, Lambda, MetaVariable, Pi, TypeKind, Variable } from "./ast";
import { free_variables } from "./free_variables";
import { new_variable } from "./new_variable";
import { substitute } from "./substitute";
import { ast_in, is_binder, v_union } from "./utilities";

type Ast = AbstractSyntaxTree
export function alpha_equality(bound: Variable[], ast1: Ast, ast2: Ast): boolean {
    if (ast1 instanceof TypeKind && ast2 instanceof TypeKind)
        return true
    if (ast1 instanceof Constant && ast2 instanceof Constant)
        return ast1.id === ast2.id
    if (ast1 instanceof MetaVariable && ast2 instanceof MetaVariable)
        return ast1.id === ast2.id
    if (ast1 instanceof Variable && ast2 instanceof Variable)
        return ast1.id === ast2.id && ast_in(ast1, bound)
    if (ast1 instanceof Application && ast2 instanceof Application)
        return alpha_equality(bound, ast1.head, ast2.head)
            && alpha_equality(bound, ast1.arg, ast2.arg)
    if (is_binder(ast1) && is_binder(ast2))
        return binders_of_type_equal(bound, ast1, ast2)
    return false
}

function binders_of_type_equal<B extends Lambda | Pi>(bound: Variable[], b1: B, b2: B): boolean {
    /*
    if (!(b1 instanceof Lambda && b2 instanceof Lambda) && !(b1 instanceof Pi && b2 instanceof Pi))
        return false
    const b1_vars = v_union([b1.bound], free_variables([], b1.scope))
    const new_var = new_variable(v_union(b1_vars, free_variables([], b2.scope)), b1.bound)
    const renamed_b2_body = substitute(b1.bound, new_var, b2.scope)
    const b2_body = substitute(b2.bound, b1.bound, renamed_b2_body)
    const mod_bound = v_union(bound, [b1.bound])
    return alpha_equality(bound, b1.type, b2.type)
        && alpha_equality(mod_bound, b1.scope, b2_body)
    */
   return binders_of_type_similar(
       false,
       (bound, b1, b2) => alpha_equality(bound, b1, b2),
       (bound, types_equal, b1, b2) => types_equal && alpha_equality(bound, b1, b2),
   )(b1, b2, bound)
}

export const binders_of_type_similar = <
    Similarity,
    B extends Lambda | Pi
>(
    not_same_binder_return: Similarity,
    compare_types: (bound: Variable[], type1: Ast, type2: Ast) => Similarity,
    compare_scopes: (bound: Variable[], type_similarity: Similarity, scope1: Ast, scope2: Ast) => Similarity,
) => (
    b1: B,
    b2: B,
    bound: Variable[] = []
): Similarity => {
    if (!(b1 instanceof Lambda && b2 instanceof Lambda) && !(b1 instanceof Pi && b2 instanceof Pi))
        return not_same_binder_return
    const b1_vars = v_union([b1.bound], free_variables([], b1.scope))
    const new_var = new_variable(v_union(b1_vars, free_variables([], b2.scope)), b1.bound)
    const renamed_b2_body = substitute(b1.bound, new_var, b2.scope)
    const b2_body = substitute(b2.bound, b1.bound, renamed_b2_body)
    const mod_bound = v_union(bound, [b1.bound])
    // return combine(compare_types(bound, b1.type, b2.type), compare_scopes(mod_bound, b1.scope, b2_body))
    return compare_scopes(mod_bound, compare_types(bound, b1.type, b2.type), b1.scope, b2_body)
}