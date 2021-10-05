// I did a no-no and just copy-pasted most of this code from ast-syntactic-equality.test.ts.
import { AbstractSyntaxTree, Constant, Lambda, MetaVariable, Pi, TypeKind, Variable } from "../../src/lambda_pi/ast";
import { alpha_equality } from "../../src/lambda_pi/alpha-equality";
import { shallow_application1, shallow_application2, deep_application1, deep_application2, shallow_lambda1, shallow_lambda2, deep_lambda1, deep_lambda2, shallow_pi1, deep_pi1, shallow_pi2, deep_pi2 } from "../../src/lambda_pi/ast-examples";

type Ast = AbstractSyntaxTree

function test_alpha_equality(name: string, input0: Variable[], input1: Ast, input2: Ast, expected: boolean) {
    const result = alpha_equality(input0, input1, input2)
    test(`alpha_equality ${name}`, () => expect(result).toEqual(expected))
}

const [x, y, c] = [new Variable("x"), new Variable("y"), new Constant("c")]

// TypeKind
test_alpha_equality("TypeKind", [], new TypeKind(), new TypeKind(), true)
test_alpha_equality("TypeKind unequal", [], new TypeKind(), new Constant("x"), false)
// Constant
test_alpha_equality("Constant", [], new Constant("something"), new Constant("something"), true)
test_alpha_equality("Constant unequal", [], new Constant("something"), new Constant("else"), false)
test_alpha_equality("Constant wrong class", [], new Constant("something"), new Variable("something"), false)
// Variable
test_alpha_equality("Variable", [], new Variable("something"), new Variable("something"), false)
test_alpha_equality("Variable", [new Variable("something")], new Variable("something"), new Variable("something"), true)
test_alpha_equality("Variable unequal", [], new Variable("something"), new Variable("else"), false)
test_alpha_equality("Variable wrong class", [], new Variable("something"), new Constant("something"), false)
// MetaVariable
test_alpha_equality("MetaVariable", [], new MetaVariable("something"), new MetaVariable("something"), true)
test_alpha_equality("MetaVariable unequal", [], new MetaVariable("something"), new MetaVariable("somethinge"), false)
test_alpha_equality("MetaVariable wrong class", [], new MetaVariable("something"), new Variable("something"), false)
// Application
test_alpha_equality("Application shallow", [x], shallow_application1, shallow_application1, true)
test_alpha_equality("Application shallow unequal", [], shallow_application1, shallow_application2, false)
test_alpha_equality("Application deep", [x], deep_application1, deep_application1, true)
test_alpha_equality("Application deep unequal", [], deep_application1, deep_application2, false)
test_alpha_equality("Application wrong class", [], shallow_application1, new Variable("else"), false)
// Lambda
test_alpha_equality("Lambda shallow", [], shallow_lambda1, shallow_lambda1, true)
test_alpha_equality("Lambda shallow unequal", [], shallow_lambda1, shallow_lambda2, false)
// Lx:(Lx:Type.c).Ly:y.Type
test_alpha_equality("Lambda deep", [y], deep_lambda1, deep_lambda1, true)
test_alpha_equality("Lambda deep unequal", [], deep_lambda1, deep_lambda2, false)
test_alpha_equality("Lambda wrong class", [], deep_lambda1, deep_application1, false)
// Pi
test_alpha_equality("Pi shallow", [], shallow_pi1, shallow_pi1, true)
test_alpha_equality("Pi shallow unequal", [], shallow_pi1, shallow_pi2, false)
test_alpha_equality("Pi deep", [y], deep_pi1, deep_pi1, true)
test_alpha_equality("Pi deep unequal", [], deep_pi1, deep_pi2, false)
test_alpha_equality("Pi wrong class", [], deep_pi1, deep_lambda1, false)
// Specific to alpha_equality
const l = (b: Variable, t: Ast, s: Ast) => new Lambda(b, t, s)
test_alpha_equality("Constants", [], c, c, true)
test_alpha_equality("Variables equal", [], y, y, false)
test_alpha_equality("Variables not equal", [], x, y, false)
test_alpha_equality("Lambda id", [], l(x, c, x), l(y, c, y), true)
test_alpha_equality("Lambda x free", [], l(x, c, x), l(y, c, x), false)
// The following is false because x is free in Ly:c.x but bound in Lx:c.x.
test_alpha_equality("Lambda x bound", [x], l(x, c, x), l(y, c, x), false)
test_alpha_equality("Lambda nested", [], l(x, c, l(y, x, y)), l(y, c, l(x, y, x)), true)
const p = (b: Variable, t: Ast, s: Ast) => new Pi(b, t, s)
test_alpha_equality("Pi id", [], p(x, c, x), p(y, c, y), true)
test_alpha_equality("Pi x free", [], p(x, c, x), p(y, c, x), false)
// The following is false because x is free in Py:c.x but bound in Px:c.x.
test_alpha_equality("Pi x bound", [x], p(x, c, x), p(y, c, x), false)
test_alpha_equality("Pi nested", [], p(x, c, p(y, x, y)), p(y, c, p(x, y, x)), true)