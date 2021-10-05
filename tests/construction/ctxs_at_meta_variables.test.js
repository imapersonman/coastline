"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shorthands_1 = require("../../src/lambda_pi/shorthands");
const RecursiveMap_1 = require("../../src/map/RecursiveMap");
const ctxs_at_metavariables_1 = require("../../src/construction/ctxs_at_metavariables");
const test_ctxs_at_meta_variables = (n, ast, mvs, output) => test(`ctxs_at_meta_variables ${n}`, () => expect((0, ctxs_at_metavariables_1.ctxs_at_meta_variables)(ast, mvs)).toEqual(output));
const [X, Y, Z] = (0, shorthands_1.mvlist)("X", "Y", "Z");
const [a, b, c] = (0, shorthands_1.clist)("a", "b", "c");
const [x, y, z] = (0, shorthands_1.ovlist)("x", "y", "z");
const ctxs_at_meta_variables_tests = [
    // TypeKind
    ["(Type, []) --> []", shorthands_1.type_k, [], []],
    ["(Type, [X]) --> [undefined]", shorthands_1.type_k, [X], [undefined]],
    ["(Type, [X, Y, Z]) --> [undefined, undefined, undefined]", shorthands_1.type_k, [X, Y, Z], [undefined, undefined, undefined]],
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
    ["(Z, [Z]) --> [mk_map()]", Z, [Z], [(0, RecursiveMap_1.mk_map)()]],
    ["(X, [X, Y, Z]) --> [mk_map(), undefined, undefined]", X, [X, Y, Z], [(0, RecursiveMap_1.mk_map)(), undefined, undefined]],
    ["(Y, [X, Y, Z]) --> [undefined, mk_map(), undefined]", Y, [X, Y, Z], [undefined, (0, RecursiveMap_1.mk_map)(), undefined]],
    ["(Z, [X, Y, Z]) --> [undefined, undefined, mk_map()]", Z, [X, Y, Z], [undefined, undefined, (0, RecursiveMap_1.mk_map)()]],
    // Application
    ["(a(x), []) --> []", (0, shorthands_1.app)(a, x), [], []],
    ["(a(x), [X]) --> [undefined]", (0, shorthands_1.app)(a, x), [X], [undefined]],
    ["(X(a), [X]) --> [mk_map()]", (0, shorthands_1.app)(X, a), [X], [(0, RecursiveMap_1.mk_map)()]],
    ["(X(Y), [Y]) --> [mk_map()]", (0, shorthands_1.app)(X, Y), [Y], [(0, RecursiveMap_1.mk_map)()]],
    ["(X(a), [X, Y]) --> [mk_map(), undefined]", (0, shorthands_1.app)(X, a), [X, Y], [(0, RecursiveMap_1.mk_map)(), undefined]],
    ["(X(Y), [X, Y]) --> [mk_map(), mk_map()]", (0, shorthands_1.app)(X, Y), [X, Y], [(0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)()]],
    ["(a(x(Z)), []) --> []", (0, shorthands_1.app)(a, (0, shorthands_1.app)(x, Z)), [], []],
    ["(a(x(Z)), [Z]) --> [mk_map()]", (0, shorthands_1.app)(a, (0, shorthands_1.app)(x, Z)), [Z], [(0, RecursiveMap_1.mk_map)()]],
    ["(a(Y(c)), [Z]) --> [undefined]", (0, shorthands_1.app)(a, (0, shorthands_1.app)(Y, c)), [Z], [undefined]],
    ["(X(Y(Z)), [X, Z]) --> [mk_map(), mk_map()]", (0, shorthands_1.app)(X, (0, shorthands_1.app)(Y, Z)), [X, Z], [(0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)()]],
    ["(X(Y(Z)), [X, Y, Z]) --> [mk_map(), mk_map(), mk_map()]", (0, shorthands_1.app)(X, (0, shorthands_1.app)(Y, Z)), [X, Y, Z], [(0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)()]],
    ["((X(Y))(Z), [X, Y, Z]) --> [mk_map(), mk_map(), mk_map()]", (0, shorthands_1.app)((0, shorthands_1.app)(X, Y), Z), [X, Y, Z], [(0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)()]],
    // Lambda
    ["(λ(x: a).b, []) --> []", (0, shorthands_1.la)(x, a, b), [], []],
    ["(λ(x: a).b, [X]) --> [undefined]", (0, shorthands_1.la)(x, a, b), [X], [undefined]],
    ["(λ(x: Y).Z, [X, Z]) --> [undefined, mk_map()]", (0, shorthands_1.la)(x, Y, Z), [X, Z], [undefined, (0, RecursiveMap_1.mk_map)(["x", Y])]],
    ["(λ(x: Y).c, [X, Y, Z]) --> [undefined, mk_map(), undefined]", (0, shorthands_1.la)(x, Y, c), [X, Y, Z], [undefined, (0, RecursiveMap_1.mk_map)(), undefined]],
    ["(λ(x: Y).Z, [Y, Z]) --> [mk_map(), mk_map([x: Y])]", (0, shorthands_1.la)(x, Y, Z), [Y, Z], [(0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)(["x", Y])]],
    ["(λ(x: X).λ(y: Y).a, []) --> []", (0, shorthands_1.la)(x, X, (0, shorthands_1.la)(y, Y, a)), [], []],
    ["(λ(x: X).λ(y: Y).Z, [X, Y, Z]) --> [mk_map(), mk_map([x: X]), mk_map([x: X], [y: Y])]", (0, shorthands_1.la)(x, X, (0, shorthands_1.la)(y, Y, Z)), [X, Y, Z], [(0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)(["x", X]), (0, RecursiveMap_1.mk_map)(["x", X], ["y", Y])]],
    ["(λ(x: X).λ(y: Y).Z, [Y, Z, X]) --> [mk_map([x: X]), mk_map([x: X], [y: Y]), mk_map()]", (0, shorthands_1.la)(x, X, (0, shorthands_1.la)(y, Y, Z)), [Y, Z, X], [(0, RecursiveMap_1.mk_map)(["x", X]), (0, RecursiveMap_1.mk_map)(["x", X], ["y", Y]), (0, RecursiveMap_1.mk_map)()]],
    ["(λ(x: X).λ(y: x).Z, [Y, Z, X]) --> [undefined, mk_map([x: X], [y: x]), mk_map()]", (0, shorthands_1.la)(x, X, (0, shorthands_1.la)(y, x, Z)), [Y, Z, X], [undefined, (0, RecursiveMap_1.mk_map)(["x", X], ["y", x]), (0, RecursiveMap_1.mk_map)()]],
    // Pi
    ["(Π(x: a).b, []) --> []", (0, shorthands_1.pi)(x, a, b), [], []],
    ["(Π(x: a).b, [X]) --> [undefined]", (0, shorthands_1.pi)(x, a, b), [X], [undefined]],
    ["(Π(x: Y).Z, [X, Z]) --> [undefined, mk_map()]", (0, shorthands_1.pi)(x, Y, Z), [X, Z], [undefined, (0, RecursiveMap_1.mk_map)(["x", Y])]],
    ["(Π(x: Y).c, [X, Y, Z]) --> [undefined, mk_map(), undefined]", (0, shorthands_1.pi)(x, Y, c), [X, Y, Z], [undefined, (0, RecursiveMap_1.mk_map)(), undefined]],
    ["(Π(x: Y).Z, [Y, Z]) --> [mk_map(), mk_map([x: Y])]", (0, shorthands_1.pi)(x, Y, Z), [Y, Z], [(0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)(["x", Y])]],
    ["(Π(x: X).Π(y: Y).a, []) --> []", (0, shorthands_1.pi)(x, X, (0, shorthands_1.pi)(y, Y, a)), [], []],
    ["(Π(x: X).Π(y: Y).Z, [X, Y, Z]) --> [mk_map(), mk_map([x: X]), mk_map([x: X], [y: Y])]", (0, shorthands_1.pi)(x, X, (0, shorthands_1.pi)(y, Y, Z)), [X, Y, Z], [(0, RecursiveMap_1.mk_map)(), (0, RecursiveMap_1.mk_map)(["x", X]), (0, RecursiveMap_1.mk_map)(["x", X], ["y", Y])]],
    ["(Π(x: X).Π(y: Y).Z, [Y, Z, X]) --> [mk_map([x: X]), mk_map([x: X], [y: Y]), mk_map()]", (0, shorthands_1.pi)(x, X, (0, shorthands_1.pi)(y, Y, Z)), [Y, Z, X], [(0, RecursiveMap_1.mk_map)(["x", X]), (0, RecursiveMap_1.mk_map)(["x", X], ["y", Y]), (0, RecursiveMap_1.mk_map)()]],
    ["(Π(x: X).Π(y: x).Z, [Y, Z, X]) --> [undefined, mk_map([x: X], [y: x]), mk_map()]", (0, shorthands_1.pi)(x, X, (0, shorthands_1.pi)(y, x, Z)), [Y, Z, X], [undefined, (0, RecursiveMap_1.mk_map)(["x", X], ["y", x]), (0, RecursiveMap_1.mk_map)()]]
];
for (const test of ctxs_at_meta_variables_tests)
    test_ctxs_at_meta_variables(...test);
