import { Application, Ast, Constant, Lambda, MetaVariable, Pi, TypeKind, Variable } from "../../src/lambda_pi/ast";
import { meta_substitute } from "../../src/lambda_pi/meta_substitute";
import { permutation } from "../../src/lambda_pi/permutation";
import { sus } from "../../src/lambda_pi/shorthands";

function test_meta_substitute(name: string, meta_var: MetaVariable, with_ast: Ast, in_ast: Ast, output: Ast) {
    const result = meta_substitute(meta_var, with_ast, in_ast)
    test(`meta_substitute ${name}`, () => expect(result).toEqual(output))
}

const [x, y] = [new Variable("x"), new Variable("y")]
const [xm, ym] = [new MetaVariable("x"), new MetaVariable("y")]

const r = new Constant("r")
test_meta_substitute("V x not replaced", xm, r, x, x)
test_meta_substitute("MV x? replaced", xm, r, xm, r)
test_meta_substitute("MV x? not replaced in suspension", ym, r, sus(permutation([x, y]), xm), sus(permutation([x, y]), xm))
test_meta_substitute("MV x? replaced in suspension without swap", xm, r, sus(permutation([x, y]), xm), r)
test_meta_substitute("MV x? replaced in suspension with swap", xm, x, sus(permutation([x, y]), xm), y)
test_meta_substitute("V y not replaced", ym, r, y, y)
test_meta_substitute("MV y? replaced", ym, r, ym, r)
test_meta_substitute("MV not replaced", xm, r, ym, y)
test_meta_substitute("A", xm, r, new TypeKind(), new TypeKind())
const L = (b: Variable, t: Ast, s: Ast) => new Lambda(b, t, s)
const P = (b: Variable, t: Ast, s: Ast) => new Pi(b, t, s)
test_meta_substitute("L case replace type", xm, r, L(x, xm, x), L(x, r, x))
test_meta_substitute("L case replace scope", xm, r, L(x, x, xm), L(x, x, r))
test_meta_substitute("P case replace type", xm, r, P(x, xm, x), P(x, r, x))
test_meta_substitute("P case replace scope", xm, r, P(x, x, xm), P(x, x, r))
