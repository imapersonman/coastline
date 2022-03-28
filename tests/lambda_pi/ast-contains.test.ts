import { Application, Ast, Constant, Lambda, MetaVariable, Pi, TypeKind, Variable } from "../../src/lambda_pi/ast";
import { contains } from "../../src/lambda_pi/contains";
import { perm } from "../../src/lambda_pi/permutation";
import { sus } from "../../src/lambda_pi/shorthands";

function test_contains(name: string, parent: Ast, child: Ast, output: boolean) {
    const result = contains(parent, child)
    test(`contains ${name}`, () => expect(result).toEqual(output))
}

const xm = new MetaVariable("x")
test_contains("!contains(MetaVariable, MetaVariable)", new MetaVariable("a"), new MetaVariable("a"), false)
const [x, y, z] = [new Variable("x"), new Variable("y"), new Variable("z")]
test_contains("!contains(Variable, Variable)", new Variable("b"), new Variable("b"), false)
const a = new Constant("a")
test_contains("!contains(Constant, Constant)", new Constant("c"), new Constant("c"), false)
test_contains("!contains(TypeKind, TypeKind)", new TypeKind, new TypeKind, false)
const L1 = new Lambda(x, y, z)
test_contains("!contains(Lambda, Lambda)", new Lambda(x, y, z), new Lambda(x, y, z), false)
const P1 = new Pi(x, y, z)
test_contains("!contains(Pi, Pi)", new Pi(x, y, z), new Pi(x, y, z), false)
const A1 = new Application(x, y)
test_contains("!contains(Application, Application", new Application(x, y), new Application(x, y), false)

test_contains("contains(Application, Lambda)", new Application(L1, y), L1, true)
test_contains("contains(Application, Lambda) swapped", new Application(y, L1), L1, true)
test_contains("!contains(Application, Lambda)", A1, L1, false)
test_contains("contains(Lambda, Pi)", new Lambda(x, P1, z), P1, true)
test_contains("contains(Lambda, Pi) swapped", new Lambda(x, z, P1), P1, true)
test_contains("!contains(Lambda, Pi)", L1, P1, false)
test_contains("contains(Pi, Application)", new Pi(x, A1, y), A1, true)
test_contains("contains(Pi, Application) swapped", new Pi(x, y, A1), A1, true)
test_contains("!contains(Pi, Application)", P1, A1, false)
test_contains("contains(Application, MetaVariable)", new Application(x, xm), xm, true)
test_contains("contains(Application, MetaVariable) swapped", new Application(xm, x), xm, true)
test_contains("!contains(Application, MetaVariable)", A1, xm, false)
test_contains("contains(Lambda, Variable)", L1, y, true)
test_contains("contains(Lambda, Variable) swapped", L1, z, true)
test_contains("!contains(Lambda, Variable)", L1, x, false)
test_contains("contains(Pi, Constant)", new Pi(x, a, y), a, true)
test_contains("contains(Pi, Constant) swapped", new Pi(x, y, a), a, true)
test_contains("!contains(Pi, Constant)", P1, a, false)
test_contains("contains(Application, TypeKind)", new Application(x, new TypeKind), new TypeKind, true)
test_contains("contains(Application, TypeKind) swapped", new Application(new TypeKind, x), new TypeKind, true)
test_contains("!contains(Application, TypeKind)", A1, new TypeKind, false)
test_contains('suspension contains', sus(perm(), xm), xm, true)
test_contains('suspension does not contains', sus(perm(), xm), new MetaVariable('Y'), false)
test_contains('suspension does not contain atom in its permutation', sus(perm([x, y]), xm), x, false)

test_contains("deep contains", new Application(new Application(new Application(new Application(a, xm), x), y), z), a, true)