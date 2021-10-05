"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ast_1 = require("../../src/lambda_pi/ast");
const meta_substitute_1 = require("../../src/lambda_pi/meta_substitute");
function test_meta_substitute(name, meta_var, with_ast, in_ast, output) {
    const result = (0, meta_substitute_1.meta_substitute)(meta_var, with_ast, in_ast);
    test(`meta_substitute ${name}`, () => expect(result).toEqual(output));
}
const [x, y] = [new ast_1.Variable("x"), new ast_1.Variable("y")];
const [xm, ym] = [new ast_1.MetaVariable("x"), new ast_1.MetaVariable("y")];
const r = new ast_1.Constant("r");
test_meta_substitute("V x not replaced", xm, r, x, x);
test_meta_substitute("MV x? replaced", xm, r, xm, r);
test_meta_substitute("V y not replaced", ym, r, y, y);
test_meta_substitute("MV y? replaced", ym, r, ym, r);
test_meta_substitute("MV not replaced", xm, r, ym, y);
test_meta_substitute("A", xm, r, new ast_1.TypeKind(), new ast_1.TypeKind());
const L = (b, t, s) => new ast_1.Lambda(b, t, s);
const P = (b, t, s) => new ast_1.Pi(b, t, s);
test_meta_substitute("L case replace type", xm, r, L(x, xm, x), L(x, r, x));
test_meta_substitute("L case replace scope", xm, r, L(x, x, xm), L(x, x, r));
test_meta_substitute("P case replace type", xm, r, P(x, xm, x), P(x, r, x));
test_meta_substitute("P case replace scope", xm, r, P(x, x, xm), P(x, x, r));
