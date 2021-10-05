import { MetaVariable, Variable } from "../../src/lambda_pi/ast"
import { app, clist, gv, imv, la, mvlist, ovlist, pi, type_k } from "../../src/lambda_pi/shorthands"
import { IndexedValue } from "../../src/construction/indexed_value"
import { AppliedRelativelyNamedAst, applied_relatively_named_ast, apply_relatively_named_ast } from "../../src/construction/apply_relatively_named_ast"
import { RelativelyNamedAst } from "../../src/construction/relatively_named_ast"

const [X, Y, Z] = mvlist("X", "Y", "Z")
const [x, y, z] = ovlist("x", "y", "z")
const [a, b, c] = clist("a", "b", "c")
const iov = (i: number) => gv("", i)

const m0: IndexedValue<MetaVariable> = imv
const v0: IndexedValue<Variable> = iov
const m2: IndexedValue<MetaVariable> = (i) => imv(i + 2)
const v2: IndexedValue<Variable> = (i) => iov(i + 2)
const arna = applied_relatively_named_ast
type ApplyRelativelyNamedAstTestCase = [RelativelyNamedAst, IndexedValue<MetaVariable>, IndexedValue<Variable>, AppliedRelativelyNamedAst, string]
const apply_relatively_named_ast_tests: ApplyRelativelyNamedAstTestCase[] = [
    // 0
    [(m, v) => app(la(x, a, Y), app(pi(y, x, z), type_k)), m0, v0, arna(app(la(x, a, Y), app(pi(y, x, z), type_k)), [], []), "neither m nor v are called"],
    // 1
    [(m, v) => app(la(x, a, Y), app(pi(y, m(0), z), type_k)), m0, v0, arna(app(la(x, a, Y), app(pi(y, imv(0), z), type_k)), [imv(0)], []), "m called once 0"],
    // 2
    [(m, v) => app(la(x, a, Y), app(m(4), type_k)), m0, v0, arna(app(la(x, a, Y), app(imv(4), type_k)), [imv(4)], []), "m called once +"],
    // 3
    [(m, v) => app(la(x, a, Y), app(m(-3), type_k)), m0, v0, arna(app(la(x, a, Y), app(imv(-3), type_k)), [imv(-3)], []), "m called once -"],
    // 4
    [(m, v) => app(la(x, m(0), m(8)), app(m(-3), type_k)), m0, v0, arna(app(la(x, imv(0), imv(8)), app(imv(-3), type_k)), [imv(-3), imv(0), imv(8)], []), "m called > once"],
    // 5
    [(m, v) => app(la(x, a, Y), app(pi(y, v(0), z), type_k)), m0, v0, arna(app(la(x, a, Y), app(pi(y, iov(0), z), type_k)), [], [iov(0)]), "v called once 0"],
    // 6
    [(m, v) => app(la(x, a, Y), app(v(4), type_k)), m0, v0, arna(app(la(x, a, Y), app(iov(4), type_k)), [], [iov(4)]), "v called once +"],
    // 7
    [(m, v) => app(la(x, a, Y), app(v(-3), type_k)), m0, v0, arna(app(la(x, a, Y), app(iov(-3), type_k)), [], [iov(-3)]), "v called once -"],
    // 8
    [(m, v) => app(la(x, a, Y), app(v(-3), type_k)), m0, v0, arna(app(la(x, a, Y), app(iov(-3), type_k)), [], [iov(-3)]), "v called > once"],
    // 9
    [(m, v) => app(la(x, v(0), v(8)), app(v(-3), type_k)), m0, v0, arna(app(la(x, iov(0), iov(8)), app(iov(-3), type_k)), [], [iov(-3), iov(0), iov(8)]), "v called > once"],
    // 10
    [(m, v) => app(app(X, app(m(0), v(3))), app(m(0), app(v(9), m(-2)))), m0, v0, arna(app(app(X, app(imv(0), iov(3))), app(imv(0), app(iov(9), imv(-2)))), [imv(-2), imv(0)], [iov(3), iov(9)]), "mixed with m duplicate"],
    // 11
    [(m, v) => app(app(X, app(m(4), v(3))), app(x, app(v(3), m(-2)))), m0, v0, arna(app(app(X, app(imv(4), iov(3))), app(x, app(iov(3), imv(-2)))), [imv(-2), imv(4)], [iov(3)]), "mixed with v duplicate"],
    // 12
    [(m, v) => app(la(x, a, Y), app(pi(y, x, z), type_k)), m2, v2, arna(app(la(x, a, Y), app(pi(y, x, z), type_k)), [], []), "neither m nor v are called 2"],
    // 13
    [(m, v) => app(la(x, a, Y), app(pi(y, m(0), z), type_k)), m2, v2, arna(app(la(x, a, Y), app(pi(y, imv(2), z), type_k)), [imv(2)], []), "m called once 0 2"],
    // 14
    [(m, v) => app(la(x, a, Y), app(m(4), type_k)), m2, v2, arna(app(la(x, a, Y), app(imv(6), type_k)), [imv(6)], []), "m called once + 2"],
    // 15
    [(m, v) => app(la(x, a, Y), app(m(-3), type_k)), m2, v2, arna(app(la(x, a, Y), app(imv(-1), type_k)), [imv(-1)], []), "m called once - 2"],
    // 16
    [(m, v) => app(la(x, m(0), m(8)), app(m(-3), type_k)), m2, v2, arna(app(la(x, imv(2), imv(10)), app(imv(-1), type_k)), [imv(-1), imv(2), imv(10)], []), "m called > once 2"],
    // 17
    [(m, v) => app(la(x, a, Y), app(pi(y, v(0), z), type_k)), m2, v2, arna(app(la(x, a, Y), app(pi(y, iov(2), z), type_k)), [], [iov(2)]), "v called once 0 2"],
    // 18
    [(m, v) => app(la(x, a, Y), app(v(4), type_k)), m2, v2, arna(app(la(x, a, Y), app(iov(6), type_k)), [], [iov(6)]), "v called once + 2"],
    // 19
    [(m, v) => app(la(x, a, Y), app(v(-3), type_k)), m2, v2, arna(app(la(x, a, Y), app(iov(-1), type_k)), [], [iov(-1)]), "v called once - 2"],
    // 20
    [(m, v) => app(la(x, a, v(2)), app(v(-3), type_k)), m2, v2, arna(app(la(x, a, iov(4)), app(iov(-1), type_k)), [], [iov(-1), iov(4)]), "v called > once 2"],
    // 21
    [(m, v) => app(la(x, v(0), v(8)), app(v(-3), type_k)), m2, v2, arna(app(la(x, iov(2), iov(10)), app(iov(-1), type_k)), [], [iov(-1), iov(2), iov(10)]), "v called > once 2"],
    // 22
    [(m, v) => app(app(X, app(m(0), v(3))), app(m(0), app(v(9), m(-2)))), m2, v2, arna(app(app(X, app(imv(2), iov(5))), app(imv(2), app(iov(11), imv(0)))), [imv(0), imv(2)], [iov(5), iov(11)]), "mixed with m duplicate 2"],
    // 23
    [(m, v) => app(app(X, app(m(4), v(3))), app(x, app(v(3), m(-2)))), m2, v2, arna(app(app(X, app(imv(6), iov(5))), app(x, app(iov(5), imv(0)))), [imv(0), imv(6)], [iov(5)]), "mixed with v duplicate 2"],
]

const run_apply_relatively_named_ast_case = (c: ApplyRelativelyNamedAstTestCase): AppliedRelativelyNamedAst =>
    apply_relatively_named_ast(c[0], c[1], c[2])

for (const c of apply_relatively_named_ast_tests)
    test(`apply_relatively_named_ast ${c[4]}`, () => expect(run_apply_relatively_named_ast_case(c)).toEqual(c[3]))