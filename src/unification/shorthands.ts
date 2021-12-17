import { Ast } from "../lambda_pi/ast";
import { ast_to_string } from "../lambda_pi/utilities";
import { is_unification_error, Substitution, UnificationError, unify as dumb_unify } from "./first_order";
import { is_match_error, match } from "./first_order_match";

export const unify = (left: Ast, right: Ast): Substitution | UnificationError => dumb_unify([{}, [[left, right]]])
export const try_unify = (left: Ast, right: Ast): Substitution => {
    const u = unify(left, right)
    if (is_unification_error(u))
        throw new Error(`${ast_to_string(u)} doesn't unify with ${ast_to_string(u)}`)
    return u
}
export const try_match = (left: Ast, right: Ast): Substitution => {
    const m = match(left, right)
    if (is_match_error(m))
        throw new Error(`${ast_to_string(m)} doesn't match ${ast_to_string(m)}`)
    return m
}