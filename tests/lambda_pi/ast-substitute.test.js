"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ast_1 = require("../../src/lambda_pi/ast");
const new_variable_1 = require("../../src/lambda_pi/new_variable");
const substitute_1 = require("../../src/lambda_pi/substitute");
const [x, y, something] = [new ast_1.Variable("x"), new ast_1.Variable("y"), new ast_1.Variable("something")];
function test_substitute(name, v, with_ast, in_ast, expected) {
    const result = (0, substitute_1.substitute)(v, with_ast, in_ast);
    test(`substitute ${name}`, () => expect(result).toEqual(expected));
}
const r = new ast_1.Constant("r");
test_substitute("V x replaced", x, r, x, r);
test_substitute("V y replaced", y, r, y, r);
test_substitute("V not replaced", x, r, y, y);
const xm = new ast_1.MetaVariable("x");
test_substitute("MV not replaced", x, r, xm, xm);
test_substitute("A", x, r, new ast_1.TypeKind(), new ast_1.TypeKind());
const B = (b, t, s) => new ast_1.Lambda(b, t, s);
test_substitute("B case (d)", x, r, B(x, x, x), B(x, x, x));
test_substitute("B case (e)", x, r, B(y, x, y), B(y, r, y));
const [xy, ry, z] = [new ast_1.Application(x, y), new ast_1.Application(r, y), new ast_1.GeneratedVariable("y", 1)];
test_substitute("B case (f)", x, r, B(y, x, xy), B(y, r, ry));
test_substitute("B case (f2)", x, r, new ast_1.Pi(y, x, xy), new ast_1.Pi(y, r, ry));
test_substitute("B case (g)", x, ry, B(y, x, xy), B(z, ry, new ast_1.Application(ry, z)));
const [rr, xx] = [new ast_1.Application(r, r), new ast_1.Application(x, x)];
test_substitute("B case (c)", x, r, xx, rr);
function test_new_variable(name, free, old, expected) {
    const result = (0, new_variable_1.new_variable)(free, old);
    test(`new variable ${name}`, () => expect(result).toEqual(expected));
}
const gv = (base, index) => new ast_1.GeneratedVariable(base, index);
test_new_variable("empty, y", [], y, y);
test_new_variable("containing, something", [something], something, gv("something", 1));
test_new_variable("containing, generated", [gv("y", 2)], gv("y", 2), gv("y", 3));
test_new_variable("non-empty", [x], y, y);
test_new_variable("non-empty containing", [x, y], y, gv("y", 1));
test_new_variable("non-empty nth generated", [x, gv("y", 1), y, gv("y", 2)], y, gv("y", 3));
test_new_variable("multiple generated bases", [gv("y", 2), gv("x", 2), gv("y", 3)], gv("y", 2), gv("y", 4));
