"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ast_1 = require("../../src/lambda_pi/ast");
const free_variables_1 = require("../../src/lambda_pi/free_variables");
// differentiate Tests
const v_string = "Atomic Variable";
const fv_string = (v) => v_string;
const a_string = "Atomic Non-Variable";
const fa_string = () => a_string;
const b_string = "Non-Atomic Binder";
const fb_string = (b, t, s) => b_string;
const nb_string = "Non-Atomic Non-Binder";
const fnb_string = (...sub_asts) => nb_string;
function test_differentiate(name, input, expected) {
    const result = (0, free_variables_1.differentiate)(input, fv_string, fa_string, fb_string, fnb_string);
    test(`differentiate ${name}`, () => expect(result).toEqual(expected));
}
const [x, y, z] = [new ast_1.Variable("x"), new ast_1.Variable("y"), new ast_1.Variable("z")];
test_differentiate("Variable", x, v_string);
test_differentiate("TypeKind", new ast_1.TypeKind(), a_string);
test_differentiate("Constant", new ast_1.Constant("a"), a_string);
test_differentiate("MetaVariable", new ast_1.MetaVariable("x"), a_string);
test_differentiate("Lambda", new ast_1.Lambda(x, y, z), b_string);
test_differentiate("Pi", new ast_1.Pi(x, y, z), b_string);
test_differentiate("Application", new ast_1.Application(x, y), nb_string);
// free_variables Tests
function test_free_variables(name, bound, ast, expected) {
    const result = (0, free_variables_1.free_variables)(bound, ast);
    test(`free_variables ${name}`, () => expect(result).toEqual(expected));
}
test_free_variables("V not in non-empty set", [x, y], z, [z]);
test_free_variables("V in non-empty set", [x, y], x, []);
test_free_variables("A empty set", [], new ast_1.TypeKind(), []);
test_free_variables("A non-empty set", [x, y], new ast_1.TypeKind(), []);
const b_rep = (b, t, s) => new ast_1.Lambda(b, t, s);
test_free_variables("B empty set Bx:y.x", [], b_rep(x, y, x), [y]);
test_free_variables("B empty set Bx:x.x", [], b_rep(x, x, x), [x]);
test_free_variables("B empty set Bx:z.y", [], b_rep(x, z, y), [z, y]);
test_free_variables("B non-empty set [z] Bx:z.y", [z], b_rep(x, z, y), [y]);
test_free_variables("B non-empty set [y] Bx:z.y 2", [y], b_rep(x, z, y), [z]);
test_free_variables("B deep", [], b_rep(z, b_rep(x, y, x), b_rep(new ast_1.Variable("w"), z, x)), [y, x]);
const nb_rep = (head, arg) => new ast_1.Application(head, arg);
test_free_variables("NB empty set", [], nb_rep(x, y), [x, y]);
test_free_variables("NB non-empty set", [x, y], nb_rep(x, y), []);
test_free_variables("NB deep", [x], nb_rep(nb_rep(x, y), nb_rep(x, y)), [y]);
