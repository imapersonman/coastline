"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// I did a no-no and just copy-pasted most of this code from ast-syntactic-equality.test.ts.
const ast_1 = require("../../src/lambda_pi/ast");
const alpha_equality_1 = require("../../src/lambda_pi/alpha-equality");
const ast_examples_1 = require("../../src/lambda_pi/ast-examples");
function test_alpha_equality(name, input0, input1, input2, expected) {
    const result = (0, alpha_equality_1.alpha_equality)(input0, input1, input2);
    test(`alpha_equality ${name}`, () => expect(result).toEqual(expected));
}
const [x, y, c] = [new ast_1.Variable("x"), new ast_1.Variable("y"), new ast_1.Constant("c")];
// TypeKind
test_alpha_equality("TypeKind", [], new ast_1.TypeKind(), new ast_1.TypeKind(), true);
test_alpha_equality("TypeKind unequal", [], new ast_1.TypeKind(), new ast_1.Constant("x"), false);
// Constant
test_alpha_equality("Constant", [], new ast_1.Constant("something"), new ast_1.Constant("something"), true);
test_alpha_equality("Constant unequal", [], new ast_1.Constant("something"), new ast_1.Constant("else"), false);
test_alpha_equality("Constant wrong class", [], new ast_1.Constant("something"), new ast_1.Variable("something"), false);
// Variable
test_alpha_equality("Variable", [], new ast_1.Variable("something"), new ast_1.Variable("something"), false);
test_alpha_equality("Variable", [new ast_1.Variable("something")], new ast_1.Variable("something"), new ast_1.Variable("something"), true);
test_alpha_equality("Variable unequal", [], new ast_1.Variable("something"), new ast_1.Variable("else"), false);
test_alpha_equality("Variable wrong class", [], new ast_1.Variable("something"), new ast_1.Constant("something"), false);
// MetaVariable
test_alpha_equality("MetaVariable", [], new ast_1.MetaVariable("something"), new ast_1.MetaVariable("something"), true);
test_alpha_equality("MetaVariable unequal", [], new ast_1.MetaVariable("something"), new ast_1.MetaVariable("somethinge"), false);
test_alpha_equality("MetaVariable wrong class", [], new ast_1.MetaVariable("something"), new ast_1.Variable("something"), false);
// Application
test_alpha_equality("Application shallow", [x], ast_examples_1.shallow_application1, ast_examples_1.shallow_application1, true);
test_alpha_equality("Application shallow unequal", [], ast_examples_1.shallow_application1, ast_examples_1.shallow_application2, false);
test_alpha_equality("Application deep", [x], ast_examples_1.deep_application1, ast_examples_1.deep_application1, true);
test_alpha_equality("Application deep unequal", [], ast_examples_1.deep_application1, ast_examples_1.deep_application2, false);
test_alpha_equality("Application wrong class", [], ast_examples_1.shallow_application1, new ast_1.Variable("else"), false);
// Lambda
test_alpha_equality("Lambda shallow", [], ast_examples_1.shallow_lambda1, ast_examples_1.shallow_lambda1, true);
test_alpha_equality("Lambda shallow unequal", [], ast_examples_1.shallow_lambda1, ast_examples_1.shallow_lambda2, false);
// Lx:(Lx:Type.c).Ly:y.Type
test_alpha_equality("Lambda deep", [y], ast_examples_1.deep_lambda1, ast_examples_1.deep_lambda1, true);
test_alpha_equality("Lambda deep unequal", [], ast_examples_1.deep_lambda1, ast_examples_1.deep_lambda2, false);
test_alpha_equality("Lambda wrong class", [], ast_examples_1.deep_lambda1, ast_examples_1.deep_application1, false);
// Pi
test_alpha_equality("Pi shallow", [], ast_examples_1.shallow_pi1, ast_examples_1.shallow_pi1, true);
test_alpha_equality("Pi shallow unequal", [], ast_examples_1.shallow_pi1, ast_examples_1.shallow_pi2, false);
test_alpha_equality("Pi deep", [y], ast_examples_1.deep_pi1, ast_examples_1.deep_pi1, true);
test_alpha_equality("Pi deep unequal", [], ast_examples_1.deep_pi1, ast_examples_1.deep_pi2, false);
test_alpha_equality("Pi wrong class", [], ast_examples_1.deep_pi1, ast_examples_1.deep_lambda1, false);
// Specific to alpha_equality
const l = (b, t, s) => new ast_1.Lambda(b, t, s);
test_alpha_equality("Constants", [], c, c, true);
test_alpha_equality("Variables equal", [], y, y, false);
test_alpha_equality("Variables not equal", [], x, y, false);
test_alpha_equality("Lambda id", [], l(x, c, x), l(y, c, y), true);
test_alpha_equality("Lambda x free", [], l(x, c, x), l(y, c, x), false);
// The following is false because x is free in Ly:c.x but bound in Lx:c.x.
test_alpha_equality("Lambda x bound", [x], l(x, c, x), l(y, c, x), false);
test_alpha_equality("Lambda nested", [], l(x, c, l(y, x, y)), l(y, c, l(x, y, x)), true);
const p = (b, t, s) => new ast_1.Pi(b, t, s);
test_alpha_equality("Pi id", [], p(x, c, x), p(y, c, y), true);
test_alpha_equality("Pi x free", [], p(x, c, x), p(y, c, x), false);
// The following is false because x is free in Py:c.x but bound in Px:c.x.
test_alpha_equality("Pi x bound", [x], p(x, c, x), p(y, c, x), false);
test_alpha_equality("Pi nested", [], p(x, c, p(y, x, y)), p(y, c, p(x, y, x)), true);
