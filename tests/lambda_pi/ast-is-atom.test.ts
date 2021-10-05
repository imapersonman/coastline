import { AbstractSyntaxTree, Constant, MetaVariable, Variable } from "../../src/lambda_pi/ast";
import { shallow_application1, shallow_lambda1, shallow_pi1, type_kind } from "../../src/lambda_pi/ast-examples";
import { is_atom } from "../../src/lambda_pi/is_atom";

function test_is_atom(name: string, input: AbstractSyntaxTree, expected: boolean) {
    const result = is_atom(input)
    test(`is_atom ${name}`, () => expect(result).toEqual(expected))
}

test_is_atom("TypeKind", type_kind, true)
test_is_atom("Constant", new Constant("something"), true)
test_is_atom("Constant", new Constant("else"), true)
test_is_atom("Variable", new Variable("is"), true)
test_is_atom("Variable", new Variable("cool"), true)
test_is_atom("MetaVariable", new MetaVariable("ye"), true)
test_is_atom("MetaVariable", new MetaVariable("ne"), true)
test_is_atom("Application", shallow_application1, false)
test_is_atom("Lambda", shallow_lambda1, false)
test_is_atom("Pi", shallow_pi1, false)