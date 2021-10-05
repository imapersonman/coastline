import { AbstractSyntaxTree, Constant, Lambda, MetaVariable, TypeKind, Variable } from "../../src/lambda_pi/ast";
import { syntactic_equality } from "../../src/lambda_pi/syntactic_equality";
import { shallow_application1, shallow_application2, deep_application1, deep_application2, shallow_lambda1, shallow_lambda2, deep_lambda1, deep_lambda2, shallow_pi1, deep_pi1, shallow_pi2, deep_pi2 } from "../../src/lambda_pi/ast-examples";

type AST = AbstractSyntaxTree

function test_syntactic_equality(name: string, input1: AST, input2: AST, expected: boolean) {
    const result = syntactic_equality(input1, input2)
    test(`syntactic_equality ${name}`, () => expect(result).toEqual(expected))
}

// TypeKind
test_syntactic_equality("TypeKind", new TypeKind(), new TypeKind(), true)
test_syntactic_equality("TypeKind unequal", new TypeKind(), new Constant("x"), false)
// Constant
test_syntactic_equality("Constant", new Constant("something"), new Constant("something"), true)
test_syntactic_equality("Constant unequal", new Constant("something"), new Constant("else"), false)
test_syntactic_equality("Constant wrong class", new Constant("something"), new Variable("something"), false)
// Variable
test_syntactic_equality("Variable", new Variable("something"), new Variable("something"), true)
test_syntactic_equality("Variable unequal", new Variable("something"), new Variable("else"), false)
test_syntactic_equality("Variable wrong class", new Variable("something"), new Constant("something"), false)
// MetaVariable
test_syntactic_equality("MetaVariable", new MetaVariable("yea"), new MetaVariable("yea"), true)
test_syntactic_equality("MetaVariable unequal", new MetaVariable("yea"), new MetaVariable("nea"), false)
test_syntactic_equality("MetaVariable wrong class", new MetaVariable("yea"), new Variable("yea"), false)
// Application
test_syntactic_equality("Application shallow", shallow_application1, shallow_application1, true)
test_syntactic_equality("Application shallow unequal", shallow_application1, shallow_application2, false)
test_syntactic_equality("Application deep", deep_application1, deep_application1, true)
test_syntactic_equality("Application deep unequal", deep_application1, deep_application2, false)
test_syntactic_equality("Application wrong class", shallow_application1, new Variable("else"), false)
// Lambda
test_syntactic_equality("Lambda shallow", shallow_lambda1, shallow_lambda1, true)
test_syntactic_equality("Lambda shallow unequal", shallow_lambda1, shallow_lambda2, false)
test_syntactic_equality("Lambda deep", deep_lambda1, deep_lambda1, true)
test_syntactic_equality("Lambda deep unequal", deep_lambda1, deep_lambda2, false)
test_syntactic_equality("Lambda wrong class", deep_lambda1, deep_application1, false)
const [weird_failed_l, weird_failed_r] = [new Lambda(new Variable("u1"), new Constant("A"), new Variable("p")), new Lambda(new Variable("u1"), new Constant("A"), new Variable("p"))]
test_syntactic_equality("Lambda weird failed", weird_failed_l, weird_failed_r, true)  // failed in feb_19_21.ipynb
// Pi
test_syntactic_equality("Pi shallow", shallow_pi1, shallow_pi1, true)
test_syntactic_equality("Pi shallow unequal", shallow_pi1, shallow_pi2, false)
test_syntactic_equality("Pi deep", deep_pi1, deep_pi1, true)
test_syntactic_equality("Pi deep unequal", deep_pi1, deep_pi2, false)
test_syntactic_equality("Pi wrong class", deep_pi1, deep_lambda1, false)
