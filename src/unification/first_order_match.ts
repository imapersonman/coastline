import { Ast } from "../lambda_pi/ast";
import { is_unification_error, Substitution, unify } from "./first_order";

export type MatchClause<Return> = { pattern: Ast, f: (u: Substitution) => Return }
export const match_clause = <Return>(pattern: Ast, f: (u: Substitution) => Return) => ({ pattern, f })

export const first_order_match = <Return>(ast: Ast, clauses: MatchClause<Return>[], no_matches?: () => Return) => {
    for (const { pattern, f } of clauses) {
        const u = unify([{}, [[pattern, ast]]])
        if (!is_unification_error(u))
            return f(u)
    }
    if (no_matches === undefined)
        throw new Error("No clauses matched")
    return no_matches()
}