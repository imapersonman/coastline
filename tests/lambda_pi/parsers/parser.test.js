"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ast_1 = require("../../../src/lambda_pi/ast");
const lambda_pi_parser_1 = require("../../../src/lambda_pi/parsers/lambda_pi_parser");
const ast_examples_1 = require("../../../src/lambda_pi/ast-examples");
const shorthands_1 = require("../../../src/lambda_pi/shorthands");
function test_parse(name, input, output) {
    const result = (0, lambda_pi_parser_1.parse)(input);
    test(`parse ${name}`, () => expect(result).toEqual(output));
}
const [a, b, c, x, y, z] = [new ast_1.Constant("a"), new ast_1.Constant("b"), new ast_1.Constant("c"), new ast_1.Variable("x"), new ast_1.Variable("y"), new ast_1.Variable("z")];
test_parse("Type", "Type", new ast_1.TypeKind);
test_parse("Type", " Type ", new ast_1.TypeKind);
// test_parse("Variable 1",  "x:", x)
test_parse("Constant 1", "c", c);
// test_parse("Variable 2",  "y:", y)
test_parse("Constant 2", "b", b);
test_parse("Generated Variable 1", "$cool_-12", (0, shorthands_1.gv)("cool", -12));
test_parse("Generated Variable 1", "$beans_4", (0, shorthands_1.gv)("beans", 4));
test_parse("Generated Variable 1", "$_28", (0, shorthands_1.iv)(28));
// test_parse("Constant", "x", new Constant("x"))
// test_parse("shallow application 1", "c x:", shallow_application1)
test_parse("shallow application 1", "c b", (0, shorthands_1.app)(c, b));
// test_parse("shallow application 2", "x: c", shallow_application2)
test_parse("shallow application 2", "b c", (0, shorthands_1.app)(b, c));
// test_parse("deep application 1", "(c x:) (x: c)", deep_application1)
test_parse("deep application 1", "(c b) (b c)", (0, shorthands_1.app)((0, shorthands_1.app)(c, b), (0, shorthands_1.app)(b, c)));
// test_parse("deep application 2", "(x: c) (c x:)", deep_application2)
test_parse("deep application 2", "(b c) (c b)", (0, shorthands_1.app)((0, shorthands_1.app)(b, c), (0, shorthands_1.app)(c, b)));
// const repeated_app_left = new Application(new Application(new Application(a, b), c), x)
// test_parse("repeated application left", "a b c x:", repeated_app_left)
const repeated_app_left = new ast_1.Application(new ast_1.Application(new ast_1.Application(a, b), c), a);
test_parse("repeated application left", "a b c a", repeated_app_left);
// const repeated_app_right = new Application(a, new Application(b, new Application(c, x)))
// test_parse("repeated application right", "a (b (c x:))", repeated_app_right)
const repeated_app_right = (0, shorthands_1.app)(a, (0, shorthands_1.app)(b, (0, shorthands_1.app)(c, a)));
test_parse("repeated application right", "a (b (c a))", repeated_app_right);
// const repeated_app_mixed = new Application(new Application(a, new Application(b, c)), x)
// test_parse("repeated application mixed", "a (b c) x:", repeated_app_mixed)
const repeated_app_mixed = new ast_1.Application(new ast_1.Application(a, new ast_1.Application(b, c)), a);
test_parse("repeated application mixed", "a (b c) a", repeated_app_mixed);
test_parse("shallow lambda 1", "L(x : Type).c", ast_examples_1.shallow_lambda1);
test_parse("shallow lambda 1 parse variable", "L($x_12 : Type).c", (0, shorthands_1.la)((0, shorthands_1.gv)("x", 12), shorthands_1.type_k, c));
// test_parse("shallow lambda 2", "L(x : y:).Type", shallow_lambda2)
test_parse("shallow lambda 2", "L(x : b).Type", (0, shorthands_1.la)(x, b, shorthands_1.type_k));
// test_parse("deep lambda 1", "L(x : L(x : Type).c).L(y : y:).Type", deep_lambda1)
test_parse("deep lambda 1", "L(x : L(x : Type).y).L(y : x).Type", (0, shorthands_1.la)(x, (0, shorthands_1.la)(x, shorthands_1.type_k, (0, shorthands_1.con)("y")), (0, shorthands_1.la)(y, x, shorthands_1.type_k)));
// test_parse("deep lambda 2", "L(x : L(x : y:).Type).L(x : Type).c", deep_lambda2)
test_parse("deep lambda 2", "L(x : L(x : x).Type).L(x : Type).c", (0, shorthands_1.la)(x, (0, shorthands_1.la)(x, (0, shorthands_1.con)("x"), shorthands_1.type_k), (0, shorthands_1.la)(x, shorthands_1.type_k, c)));
test_parse("shallow pi 1", "P(x : Type).c", ast_examples_1.shallow_pi1);
test_parse("shallow pi 1 parse variable", "L($x_-12 : Type).c", (0, shorthands_1.pi)((0, shorthands_1.gv)("x", -12), shorthands_1.type_k, c));
// test_parse("shallow pi 2", "P(y : y:).Type", shallow_pi2)
test_parse("shallow pi 2", "P(x : b).Type", (0, shorthands_1.pi)(x, b, shorthands_1.type_k));
// test_parse("deep pi 1", "P(x : P(x : Type).c).P(y : y:).Type", deep_pi1)
test_parse("deep pi 1", "P(x : P(x : Type).y).P(y : x).Type", (0, shorthands_1.pi)(x, (0, shorthands_1.pi)(x, shorthands_1.type_k, (0, shorthands_1.con)("y")), (0, shorthands_1.pi)(y, x, shorthands_1.type_k)));
// test_parse("deep pi 2", "P(x : P(y : y:).Type).P(x : Type).c", deep_pi2)
test_parse("deep pi 2", "P(x : P(x : x).Type).P(x : Type).c", (0, shorthands_1.pi)(x, (0, shorthands_1.pi)(x, (0, shorthands_1.con)("x"), shorthands_1.type_k), (0, shorthands_1.pi)(x, shorthands_1.type_k, c)));
test_parse("beta redex", "(L(x: b).x) x", new ast_1.Application(new ast_1.Lambda(x, b, x), (0, shorthands_1.con)("x")));
test_parse("meta-variable by itself", "x?", new ast_1.MetaVariable("x"));
test_parse("meta-variable in application itself", "x? y", new ast_1.Application(new ast_1.MetaVariable("x"), new ast_1.Variable("y")));
// test_parse("reverse beta redex", "a (L(x: b).z)", new Application(new Lambda(x, b, z), a))
test_parse("error on empty", "", new lambda_pi_parser_1.ParseError("", 'Expected "(", Abstraction, Application, MetaVariable, TypeKind, or VarConst but end of input found.'));
const [maj, min, A, B] = (0, shorthands_1.ovlist)("maj", "min", "A", "B");
const imp = (x, y) => (0, shorthands_1.flapp)((0, shorthands_1.con)("imp"), x, y);
const ml = (x) => (0, shorthands_1.app)((0, shorthands_1.con)("ml"), x);
const o = (0, shorthands_1.con)("o");
// Error from sig
test_parse("impe sig", "P(A: o).P(B: o).P(maj: ml (imp A B)).P(min: ml A).ml B", (0, shorthands_1.pi)(A, o, (0, shorthands_1.pi)(B, o, (0, shorthands_1.pi)(maj, ml(imp(A, B)), (0, shorthands_1.pi)(min, ml(A), ml(B))))));
