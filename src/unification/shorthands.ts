import { Ast } from "../lambda_pi/ast";
import { ast_to_string } from "../lambda_pi/utilities";
import { is_unification_error, Substitution, UnificationError, unify as dumb_unify } from "./first_order";

export const unify = (left: Ast, right: Ast): Substitution | UnificationError => dumb_unify([{}, [[left, right]]])
export const try_unify = (left: Ast, right: Ast): Substitution => {
    const u = unify(left, right)
    if (is_unification_error(u))
        throw new Error(`${ast_to_string(u)} doesn't unify with ${ast_to_string(u)}`)
    return u
}