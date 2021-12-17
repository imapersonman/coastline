import { Ast } from "../../src/lambda_pi/ast";
import { mk_default_substitution } from "../../src/unification/first_order";
import { unify_clauses, MatchClause, match_clause } from "../../src/unification/first_order_match_clauses";
import { clist, mvlist, ovlist } from "../../src/lambda_pi/shorthands";
import { throwing_unifier } from "../../src/unification/throwing_unifier";

const test_match_case = <Return>(n: string, ast: Ast, clauses: MatchClause<Return>[], no_matches: (() => Return) | undefined, out: Return) =>
    test(`first order match ${n}`, () => expect(unify_clauses(ast, clauses, no_matches)).toEqual(out))

const [a, b, c, d] = clist("a", "b", "c", "d")
const [w, x, y, z] = ovlist("w", "x", "y", "z")
const [W, X, Y, Z] = mvlist("W", "X", "Y", "Z")

test_match_case("0 clauses return 1", a, [], () => 1, 1)
test_match_case("0 clauses return 2", a, [], () => 2, 2)
test_match_case("1 clause no match", a, [match_clause(b, (u) => 2)], () => 1, 1)
test_match_case("1 clause match", a, [match_clause(a, (u) => 2)], () => 1, 2)
test_match_case("2 clause no match", a, [match_clause(b, (u) => 2), match_clause(c, (u) => 3)], () => 1, 1)
test_match_case("2 clause both match", X, [match_clause(b, (u) => 2), match_clause(c, (u) => 3)], () => 1, 2)
test_match_case("2 clause last match", c, [match_clause(b, (u) => 2), match_clause(c, (u) => 3)], () => 1, 3)
// test_match_case("2 clause return unifier", a, [match_clause(X, (u) => u)], () => throwing_unifier(mk_default_substitution([])!), throwing_unifier(mk_default_substitution([["X", a]])!))