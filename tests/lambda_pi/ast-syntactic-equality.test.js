"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ast_1 = require("../../src/lambda_pi/ast");
const syntactic_equality_1 = require("../../src/lambda_pi/syntactic_equality");
const ast_examples_1 = require("../../src/lambda_pi/ast-examples");
function test_syntactic_equality(name, input1, input2, expected) {
    const result = (0, syntactic_equality_1.syntactic_equality)(input1, input2);
    test(`syntactic_equality ${name}`, () => expect(result).toEqual(expected));
}
// TypeKind
test_syntactic_equality("TypeKind", new ast_1.TypeKind(), new ast_1.TypeKind(), true);
test_syntactic_equality("TypeKind unequal", new ast_1.TypeKind(), new ast_1.Constant("x"), false);
// Constant
test_syntactic_equality("Constant", new ast_1.Constant("something"), new ast_1.Constant("something"), true);
test_syntactic_equality("Constant unequal", new ast_1.Constant("something"), new ast_1.Constant("else"), false);
test_syntactic_equality("Constant wrong class", new ast_1.Constant("something"), new ast_1.Variable("something"), false);
// Variable
test_syntactic_equality("Variable", new ast_1.Variable("something"), new ast_1.Variable("something"), true);
test_syntactic_equality("Variable unequal", new ast_1.Variable("something"), new ast_1.Variable("else"), false);
test_syntactic_equality("Variable wrong class", new ast_1.Variable("something"), new ast_1.Constant("something"), false);
// MetaVariable
test_syntactic_equality("MetaVariable", new ast_1.MetaVariable("yea"), new ast_1.MetaVariable("yea"), true);
test_syntactic_equality("MetaVariable unequal", new ast_1.MetaVariable("yea"), new ast_1.MetaVariable("nea"), false);
test_syntactic_equality("MetaVariable wrong class", new ast_1.MetaVariable("yea"), new ast_1.Variable("yea"), false);
// Application
test_syntactic_equality("Application shallow", ast_examples_1.shallow_application1, ast_examples_1.shallow_application1, true);
test_syntactic_equality("Application shallow unequal", ast_examples_1.shallow_application1, ast_examples_1.shallow_application2, false);
test_syntactic_equality("Application deep", ast_examples_1.deep_application1, ast_examples_1.deep_application1, true);
test_syntactic_equality("Application deep unequal", ast_examples_1.deep_application1, ast_examples_1.deep_application2, false);
test_syntactic_equality("Application wrong class", ast_examples_1.shallow_application1, new ast_1.Variable("else"), false);
// Lambda
test_syntactic_equality("Lambda shallow", ast_examples_1.shallow_lambda1, ast_examples_1.shallow_lambda1, true);
test_syntactic_equality("Lambda shallow unequal", ast_examples_1.shallow_lambda1, ast_examples_1.shallow_lambda2, false);
test_syntactic_equality("Lambda deep", ast_examples_1.deep_lambda1, ast_examples_1.deep_lambda1, true);
test_syntactic_equality("Lambda deep unequal", ast_examples_1.deep_lambda1, ast_examples_1.deep_lambda2, false);
test_syntactic_equality("Lambda wrong class", ast_examples_1.deep_lambda1, ast_examples_1.deep_application1, false);
const [weird_failed_l, weird_failed_r] = [new ast_1.Lambda(new ast_1.Variable("u1"), new ast_1.Constant("A"), new ast_1.Variable("p")), new ast_1.Lambda(new ast_1.Variable("u1"), new ast_1.Constant("A"), new ast_1.Variable("p"))];
test_syntactic_equality("Lambda weird failed", weird_failed_l, weird_failed_r, true); // failed in feb_19_21.ipynb
// Pi
test_syntactic_equality("Pi shallow", ast_examples_1.shallow_pi1, ast_examples_1.shallow_pi1, true);
test_syntactic_equality("Pi shallow unequal", ast_examples_1.shallow_pi1, ast_examples_1.shallow_pi2, false);
test_syntactic_equality("Pi deep", ast_examples_1.deep_pi1, ast_examples_1.deep_pi1, true);
test_syntactic_equality("Pi deep unequal", ast_examples_1.deep_pi1, ast_examples_1.deep_pi2, false);
test_syntactic_equality("Pi wrong class", ast_examples_1.deep_pi1, ast_examples_1.deep_lambda1, false);
