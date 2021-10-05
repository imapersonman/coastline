"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Most of this copied from ast-to-beta-normal-form.test.ts
const ast_1 = require("../../src/lambda_pi/ast");
const to_weak_head_normal_form_1 = require("../../src/lambda_pi/to_weak_head_normal_form");
function test_to_weak_head_normal_form(name, input, expected) {
    const result = (0, to_weak_head_normal_form_1.to_weak_head_normal_form)(input);
    test(`to_weak_head_normal_form ${name}`, () => expect(result).toEqual(expected));
}
// Atomic tests
const [a, b, c] = [new ast_1.Constant("a"), new ast_1.Constant("b"), new ast_1.Constant("c")];
test_to_weak_head_normal_form("Constant", c, c);
const [x, y, z] = [new ast_1.Variable("x"), new ast_1.Variable("y"), new ast_1.Variable("z")];
test_to_weak_head_normal_form("Variable", x, x);
const type_kind = new ast_1.TypeKind();
test_to_weak_head_normal_form("TypeKind", type_kind, type_kind);
test_to_weak_head_normal_form("MetaVariable", new ast_1.MetaVariable("x"), new ast_1.MetaVariable("x"));
// Shallow non-redex tests
const [cx, ya] = [new ast_1.Application(c, x), new ast_1.Application(y, a)];
test_to_weak_head_normal_form("shallow application", cx, cx);
const [lambda_constant, lambda_identity] = [new ast_1.Lambda(x, a, c), new ast_1.Lambda(x, a, x)];
test_to_weak_head_normal_form("shallow lambda", lambda_constant, lambda_constant);
const pi_constant = new ast_1.Pi(x, a, c);
test_to_weak_head_normal_form("shallow pi", pi_constant, pi_constant);
// Deep no redex tests
const cx_ya = new ast_1.Application(cx, ya);
test_to_weak_head_normal_form("deep application no-redex", cx_ya, cx_ya);
const Lx_cxya_cxya = new ast_1.Lambda(x, cx_ya, cx_ya);
test_to_weak_head_normal_form("deep lambda no-redex", Lx_cxya_cxya, Lx_cxya_cxya);
const Px_cxya_cxya = new ast_1.Pi(x, cx_ya, cx_ya);
test_to_weak_head_normal_form("deep pi no-redex", Px_cxya_cxya, Px_cxya_cxya);
// Beta-redex tests no redex
const redex_shallow_constant = new ast_1.Application(lambda_constant, b);
test_to_weak_head_normal_form("beta-redex shallow constant", redex_shallow_constant, c);
const redex_shallow_identity = new ast_1.Application(lambda_identity, b);
test_to_weak_head_normal_form("beta-redex shallow variable", redex_shallow_identity, b);
const not_redex_pi = new ast_1.Application(pi_constant, b);
test_to_weak_head_normal_form("pi not beta-redex", not_redex_pi, not_redex_pi);
const redex_deep_no_redex = new ast_1.Application(new ast_1.Lambda(y, cx, ya), ya);
test_to_weak_head_normal_form("beta-redex deep no redex", redex_deep_no_redex, new ast_1.Application(ya, a));
// Deep Asts with redexes
// CHANGED
const deep_application_redexes = new ast_1.Application(redex_shallow_constant, redex_shallow_identity);
test_to_weak_head_normal_form("deep apps redexes", deep_application_redexes, new ast_1.Application(c, redex_shallow_identity));
// CHANGED
const deep_lambda_redexes = new ast_1.Lambda(z, redex_shallow_constant, redex_shallow_identity);
test_to_weak_head_normal_form("deep lambda redexes", deep_lambda_redexes, deep_lambda_redexes);
// CHANGED
const deep_pi_redexes = new ast_1.Pi(z, redex_shallow_constant, redex_shallow_identity);
test_to_weak_head_normal_form("deep pi redexes", deep_pi_redexes, deep_pi_redexes);
// Beta redex with redex
const weird_lambda = new ast_1.Lambda(x, lambda_constant, new ast_1.Application(new ast_1.Lambda(y, a, y), x));
const weird_app = new ast_1.Application(weird_lambda, z);
test_to_weak_head_normal_form("beta redex with sub redex", weird_app, z);
// Currying test
const curried = new ast_1.Lambda(x, a, new ast_1.Lambda(y, b, new ast_1.Application(y, x)));
const bz = new ast_1.Application(b, z);
const curried_app = new ast_1.Application(new ast_1.Application(curried, bz), a);
test_to_weak_head_normal_form("curried beta redex deep 3 redex", curried_app, new ast_1.Application(a, bz));
// Result is in weak-head normal form
// (Lx:a.x) ((Lx:a.x) b) |-> b
const result_weak_head = new ast_1.Application(lambda_identity, new ast_1.Application(lambda_identity, b));
test_to_weak_head_normal_form("result weak head", result_weak_head, b);
