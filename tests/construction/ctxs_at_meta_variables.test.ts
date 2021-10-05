import { Ast, MetaVariable } from "../../src/lambda_pi/ast"
import { app, clist, la, mvlist, ovlist, pi, type_k } from "../../src/lambda_pi/shorthands"
import { mk_map } from "../../src/map/RecursiveMap"
import { Ctx } from "../../src/logical_framework/ctx"
import { ctxs_at_meta_variables } from "../../src/construction/ctxs_at_metavariables"

const test_ctxs_at_meta_variables = (n: string, ast: Ast, mvs: MetaVariable[], output: (Ctx | undefined)[]): void =>
    test(`ctxs_at_meta_variables ${n}`, () => expect(ctxs_at_meta_variables(ast, mvs)).toEqual(output))

const [X, Y, Z] = mvlist("X", "Y", "Z")
const [a, b, c] = clist("a", "b", "c")
const [x, y, z] = ovlist("x", "y", "z")

const ctxs_at_meta_variables_tests: [string, Ast, MetaVariable[], (Ctx | undefined)[]][] = [
    // TypeKind
    ["(Type, []) --> []", type_k, [], []],
    ["(Type, [X]) --> [undefined]", type_k, [X], [undefined]],
    ["(Type, [X, Y, Z]) --> [undefined, undefined, undefined]", type_k, [X, Y, Z], [undefined, undefined, undefined]],
    // Constant
    ["(a, []) --> []", a, [], []],
    ["(b, [X]) --> [undefined]", b, [X], [undefined]],
    ["(c, [X, Y, Z]) --> [undefined, undefined, undefined]", c, [X, Y, Z], [undefined, undefined, undefined]],
    // Variable
    ["(x, []) --> []", x, [], []],
    ["(y, [X]) --> [undefined]", y, [X], [undefined]],
    ["(z, [X, Y, Z]) --> [undefined, undefined, undefined]", z, [X, Y, Z], [undefined, undefined, undefined]],
    // MetaVariable
    ["(X, []) --> []", X, [], []],
    ["(Y, [X]) --> [undefined]", Y, [X], [undefined]],
    ["(Z, [Z]) --> [mk_map()]", Z, [Z], [mk_map()]],
    ["(X, [X, Y, Z]) --> [mk_map(), undefined, undefined]", X, [X, Y, Z], [mk_map(), undefined, undefined]],
    ["(Y, [X, Y, Z]) --> [undefined, mk_map(), undefined]", Y, [X, Y, Z], [undefined, mk_map(), undefined]],
    ["(Z, [X, Y, Z]) --> [undefined, undefined, mk_map()]", Z, [X, Y, Z], [undefined, undefined, mk_map()]],
    // Application
    ["(a(x), []) --> []", app(a, x), [], []],
    ["(a(x), [X]) --> [undefined]", app(a, x), [X], [undefined]],
    ["(X(a), [X]) --> [mk_map()]", app(X, a), [X], [mk_map()]],
    ["(X(Y), [Y]) --> [mk_map()]", app(X, Y), [Y], [mk_map()]],
    ["(X(a), [X, Y]) --> [mk_map(), undefined]", app(X, a), [X, Y], [mk_map(), undefined]],
    ["(X(Y), [X, Y]) --> [mk_map(), mk_map()]", app(X, Y), [X, Y], [mk_map(), mk_map()]],
    ["(a(x(Z)), []) --> []", app(a, app(x, Z)), [], []],
    ["(a(x(Z)), [Z]) --> [mk_map()]", app(a, app(x, Z)), [Z], [mk_map()]],
    ["(a(Y(c)), [Z]) --> [undefined]", app(a, app(Y, c)), [Z], [undefined]],
    ["(X(Y(Z)), [X, Z]) --> [mk_map(), mk_map()]", app(X, app(Y, Z)), [X, Z], [mk_map(), mk_map()]],
    ["(X(Y(Z)), [X, Y, Z]) --> [mk_map(), mk_map(), mk_map()]", app(X, app(Y, Z)), [X, Y, Z], [mk_map(), mk_map(), mk_map()]],
    ["((X(Y))(Z), [X, Y, Z]) --> [mk_map(), mk_map(), mk_map()]", app(app(X, Y), Z), [X, Y, Z], [mk_map(), mk_map(), mk_map()]],
    // Lambda
    ["(λ(x: a).b, []) --> []", la(x, a, b), [], []],
    ["(λ(x: a).b, [X]) --> [undefined]", la(x, a, b), [X], [undefined]],
    ["(λ(x: Y).Z, [X, Z]) --> [undefined, mk_map()]", la(x, Y, Z), [X, Z], [undefined, mk_map(["x", Y])]],
    ["(λ(x: Y).c, [X, Y, Z]) --> [undefined, mk_map(), undefined]", la(x, Y, c), [X, Y, Z], [undefined, mk_map(), undefined]],
    ["(λ(x: Y).Z, [Y, Z]) --> [mk_map(), mk_map([x: Y])]", la(x, Y, Z), [Y, Z], [mk_map(), mk_map(["x", Y])]],
    ["(λ(x: X).λ(y: Y).a, []) --> []", la(x, X, la(y, Y, a)), [], []],
    ["(λ(x: X).λ(y: Y).Z, [X, Y, Z]) --> [mk_map(), mk_map([x: X]), mk_map([x: X], [y: Y])]", la(x, X, la(y, Y, Z)), [X, Y, Z], [mk_map(), mk_map(["x", X]), mk_map(["x", X], ["y", Y])]],
    ["(λ(x: X).λ(y: Y).Z, [Y, Z, X]) --> [mk_map([x: X]), mk_map([x: X], [y: Y]), mk_map()]", la(x, X, la(y, Y, Z)), [Y, Z, X], [mk_map(["x", X]), mk_map(["x", X], ["y", Y]), mk_map()]],
    ["(λ(x: X).λ(y: x).Z, [Y, Z, X]) --> [undefined, mk_map([x: X], [y: x]), mk_map()]", la(x, X, la(y, x, Z)), [Y, Z, X], [undefined, mk_map(["x", X], ["y", x]), mk_map()]],
    // Pi
    ["(Π(x: a).b, []) --> []", pi(x, a, b), [], []],
    ["(Π(x: a).b, [X]) --> [undefined]", pi(x, a, b), [X], [undefined]],
    ["(Π(x: Y).Z, [X, Z]) --> [undefined, mk_map()]", pi(x, Y, Z), [X, Z], [undefined, mk_map(["x", Y])]],
    ["(Π(x: Y).c, [X, Y, Z]) --> [undefined, mk_map(), undefined]", pi(x, Y, c), [X, Y, Z], [undefined, mk_map(), undefined]],
    ["(Π(x: Y).Z, [Y, Z]) --> [mk_map(), mk_map([x: Y])]", pi(x, Y, Z), [Y, Z], [mk_map(), mk_map(["x", Y])]],
    ["(Π(x: X).Π(y: Y).a, []) --> []", pi(x, X, pi(y, Y, a)), [], []],
    ["(Π(x: X).Π(y: Y).Z, [X, Y, Z]) --> [mk_map(), mk_map([x: X]), mk_map([x: X], [y: Y])]", pi(x, X, pi(y, Y, Z)), [X, Y, Z], [mk_map(), mk_map(["x", X]), mk_map(["x", X], ["y", Y])]],
    ["(Π(x: X).Π(y: Y).Z, [Y, Z, X]) --> [mk_map([x: X]), mk_map([x: X], [y: Y]), mk_map()]", pi(x, X, pi(y, Y, Z)), [Y, Z, X], [mk_map(["x", X]), mk_map(["x", X], ["y", Y]), mk_map()]],
    ["(Π(x: X).Π(y: x).Z, [Y, Z, X]) --> [undefined, mk_map([x: X], [y: x]), mk_map()]", pi(x, X, pi(y, x, Z)), [Y, Z, X], [undefined, mk_map(["x", X], ["y", x]), mk_map()]]
]

for (const test of ctxs_at_meta_variables_tests)
    test_ctxs_at_meta_variables(...test)