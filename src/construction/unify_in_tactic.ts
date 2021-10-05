import { Ast } from "../lambda_pi/ast"
import { is_unification_error, UnificationError } from "../unification/first_order"
import { unify } from "../unification/shorthands"
import { ThrowingUnifier, throwing_unifier } from "../unification/throwing_unifier"

export const unify_in_tactic = (l: Ast, r: Ast): ThrowingUnifier | UnificationError => {
    const u = unify(l, r)
    if (is_unification_error(u)) return u
    return throwing_unifier(u)
}