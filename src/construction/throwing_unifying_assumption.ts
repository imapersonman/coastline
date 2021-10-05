import { Variable } from "../lambda_pi/ast"
import { ThrowingUnifier, throwing_unifier } from "../unification/throwing_unifier"
import { UnifyingAssumption } from "./unifying_assumptions"

export type ThrowingUnifyingAssumption = { variable: Variable, unifier: ThrowingUnifier }
export const throwing_unifying_assumption = (ua: UnifyingAssumption): ThrowingUnifyingAssumption => ({
    variable: ua.variable,
    unifier: throwing_unifier(ua.unifier)
})