import { AbstractSyntaxTree, Application, Constant, GeneratedVariable, Lambda, MetaVariable, Pi, TypeKind, Variable } from "../../src/lambda_pi/ast";
import { new_variable } from "../../src/lambda_pi/new_variable";
import { substitute } from "../../src/lambda_pi/substitute";

type Ast = AbstractSyntaxTree
const [x, y, something] = [new Variable("x"), new Variable("y"), new Variable("something")]

function test_substitute(name: string, v: Variable, with_ast: Ast, in_ast: Ast, expected: Ast) {
    const result = substitute(v, with_ast, in_ast)
    test(`substitute ${name}`, () => expect(result).toEqual(expected))
}

const r = new Constant("r")
test_substitute("V x replaced", x, r, x, r)
test_substitute("V y replaced", y, r, y, r)
test_substitute("V not replaced", x, r, y, y)
const xm = new MetaVariable("x")
test_substitute("MV not replaced", x, r, xm, xm)
test_substitute("A", x, r, new TypeKind(), new TypeKind())
const B = (b: Variable, t: Ast, s: Ast) => new Lambda(b, t, s)
test_substitute("B case (d)", x, r, B(x, x, x), B(x, r, x))
test_substitute("B case (e)", x, r, B(y, x, y), B(y, r, y))
const [xy, ry, z] = [new Application(x, y), new Application(r, y), new GeneratedVariable("y", 1)]
test_substitute("B case (f)", x, r, B(y, x, xy), B(y, r, ry))
test_substitute("B case (f2)", x, r, new Pi(y, x, xy), new Pi(y, r, ry))
test_substitute("B case (g)", x, ry, B(y, x, xy), B(z, ry, new Application(ry, z)))
const [rr, xx] = [new Application(r, r), new Application(x, x)]
test_substitute("B case (c)", x, r, xx, rr)

function test_new_variable(name: string, free: Variable[], old: Variable, expected: Variable) {
    const result = new_variable(free, old)
    test(`new variable ${name}`, () => expect(result).toEqual(expected))
}

const gv = (base: string, index: number) => new GeneratedVariable(base, index)
test_new_variable("empty, y", [], y, y)
test_new_variable("containing, something", [something], something, gv("something", 1))
test_new_variable("containing, generated", [gv("y", 2)], gv("y", 2), gv("y", 3))
test_new_variable("non-empty", [x], y, y)
test_new_variable("non-empty containing", [x, y], y, gv("y", 1))
test_new_variable("non-empty nth generated", [x, gv("y", 1), y, gv("y", 2)], y, gv("y", 3))
test_new_variable("multiple generated bases", [gv("y", 2), gv("x", 2), gv("y", 3)], gv("y", 2), gv("y", 4))