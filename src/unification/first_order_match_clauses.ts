import { Ast } from "../lambda_pi/ast";
import { is_unification_error, Substitution, unify } from "./first_order";
import { is_match_error, match } from "./first_order_match";
import { ThrowingUnifier, throwing_unifier } from "./throwing_unifier";

export type MatchClause<Return> = { pattern: Ast, f: (u: ThrowingUnifier) => Return }
export const match_clause = <Return>(pattern: Ast, f: (u: ThrowingUnifier) => Return) => ({ pattern, f })

export const unify_clauses = <Return>(ast: Ast, clauses: MatchClause<Return>[], no_matches?: () => Return): Return => {
    for (const { pattern, f } of clauses) {
        const u = unify([{}, [[pattern, ast]]])
        if (!is_unification_error(u))
            return f(throwing_unifier(u))
    }
    if (no_matches === undefined)
        throw new Error("No clauses matched")
    return no_matches()
}

export const match_clauses = <Return>(ast: Ast, clauses: MatchClause<Return>[], no_matches?: () => Return): Return => {
    for (const { pattern, f } of clauses) {
        const m = match(pattern, ast)
        if (!is_match_error(m))
            return f(throwing_unifier(m))
    }
    if (no_matches === undefined)
        throw new Error("No clauses matched")
    return no_matches()
}