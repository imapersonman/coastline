import { Ast, Variable } from "../lambda_pi/ast"
import { ov } from "../lambda_pi/shorthands"
import { Ctx } from "../logical_framework/ctx"
import { is_unification_error, Substitution, UnificationError } from "../unification/first_order"
import { unify } from "../unification/shorthands"

export interface UnifyingAssumption { type: "UnifyingAssumption", unifier: Substitution, variable: Variable }
export const is_unifying_assumption = (ua: any): ua is UnifyingAssumption => ua.type === "UnifyingAssumption"
export const unifying_assumption = (unifier: Substitution, variable: Variable): UnifyingAssumption => ({ type: "UnifyingAssumption", unifier, variable })

export const find_unifying_assumptions = (assumptions: Ctx, pattern: Ast): UnifyingAssumption[] =>
    assumptions.entries()
               .map(([id, sort]): [string, UnificationError | Substitution, Ast] => [id, unify(pattern, sort), sort])
               .filter(([a, u, c]) => !is_unification_error(u))
               .map(([id, u, sort]) => unifying_assumption(u as Substitution, ov(id).parse()))