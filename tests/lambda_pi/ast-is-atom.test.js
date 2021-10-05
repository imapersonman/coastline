"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ast_1 = require("../../src/lambda_pi/ast");
const ast_examples_1 = require("../../src/lambda_pi/ast-examples");
const is_atom_1 = require("../../src/lambda_pi/is_atom");
function test_is_atom(name, input, expected) {
    const result = (0, is_atom_1.is_atom)(input);
    test(`is_atom ${name}`, () => expect(result).toEqual(expected));
}
test_is_atom("TypeKind", ast_examples_1.type_kind, true);
test_is_atom("Constant", new ast_1.Constant("something"), true);
test_is_atom("Constant", new ast_1.Constant("else"), true);
test_is_atom("Variable", new ast_1.Variable("is"), true);
test_is_atom("Variable", new ast_1.Variable("cool"), true);
test_is_atom("MetaVariable", new ast_1.MetaVariable("ye"), true);
test_is_atom("MetaVariable", new ast_1.MetaVariable("ne"), true);
test_is_atom("Application", ast_examples_1.shallow_application1, false);
test_is_atom("Lambda", ast_examples_1.shallow_lambda1, false);
test_is_atom("Pi", ast_examples_1.shallow_pi1, false);
