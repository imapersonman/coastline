import { concat_linked_lists, LinkedList, linked_list, linked_list_as_array, reduce_linked_list_right, reverse_linked_list, dedupe_linked_list, non_empty_linked_list, is_non_empty_linked_list, union_linked_lists, filter_linked_list } from "../linked_list"
import { is_empty } from "../utilities"
import { Ast, Variable } from "./ast"
import { app, la, sus } from "./shorthands"
import { syntactic_equality } from "./syntactic_equality"
import { is_application, is_constant, is_lambda, is_meta_variable, is_pi, is_suspension, is_type_kind, is_variable } from "./utilities"

export type Permutation = LinkedList<[Variable, Variable]>

export const permutation_to_string = (p: Permutation) => linked_list_as_array(p)
    .map(([a1, a2]) => `(${a1.id} ${a2.id})`).join('')

export const permutation: (...swaps: [Variable, Variable][]) => Permutation = linked_list
export const perm = permutation
export const invert: (p: Permutation) => Permutation = reverse_linked_list
export const concat: (p1: Permutation, p2: Permutation) => Permutation = concat_linked_lists

export const variables_in_permutation = (p: Permutation): LinkedList<Variable> =>
    dedupe_linked_list(syntactic_equality)(
        reduce_linked_list_right(
            p,
            (acc, [a1, a2]) => non_empty_linked_list(a1, non_empty_linked_list(a2, acc)),
            linked_list()))

export const apply_permutation_to_ast = (p: Permutation, ast: Ast): Ast => {
    // Variable
    const apply_permutation_to_variable = (p: Permutation, v: Variable): Variable => {
        if (!is_non_empty_linked_list(p))
            return v
        const rest_applied = apply_permutation_to_variable(p.rest, v)
        const [a1, a2] = p.head
        if (syntactic_equality(rest_applied, a1))
            return a2
        if (syntactic_equality(rest_applied, a2))
            return a1
        return rest_applied
    }
    // MetaVariable
    if (is_meta_variable(ast))
        return sus(p, ast)
    if (is_variable(ast))
        return apply_permutation_to_variable(p, ast)
    // Id
    if (!is_non_empty_linked_list(p))
        return ast
    // Suspension
    if (is_suspension(ast))
        return sus(concat(p, ast.permutation), ast.meta_variable)
    // Application
    if (is_application(ast))
        return app(apply_permutation_to_ast(p, ast.head), apply_permutation_to_ast(p, ast.arg))
    // Lambda
    if (is_lambda(ast))
        return la(apply_permutation_to_variable(p, ast.bound), apply_permutation_to_ast(p, ast.type), apply_permutation_to_ast(p, ast.scope))
    // Pi
    if (is_pi(ast))
        return la(apply_permutation_to_variable(p, ast.bound), apply_permutation_to_ast(p, ast.type), apply_permutation_to_ast(p, ast.scope))
    // TypeKind, Constant
    return ast
}

export const disagreement_set = (p1: Permutation, p2: Permutation): LinkedList<Variable> => {
    const all_variables = union_linked_lists(syntactic_equality)(variables_in_permutation(p1), variables_in_permutation(p2))
    return filter_linked_list(all_variables, (v) => !syntactic_equality(apply_permutation_to_ast(p1, v), apply_permutation_to_ast(p2, v)))
}