"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const first_order_1 = require("../../src/unification/first_order");
const ast_1 = require("../../src/lambda_pi/ast");
function test_add_to_substitution(name, in_sub, v_name, ast, output) {
    const result = (0, first_order_1.add_to_substitution)(in_sub, v_name, ast);
    test(`add_to_substitution ${name}`, () => expect(result).toEqual(output));
}
test_add_to_substitution("add_to_sub empty sub", {}, "a", new ast_1.Variable("x"), { "a": new ast_1.Variable("x") });
test_add_to_substitution("add_to_sub non-empty sub success", { "a": new ast_1.Variable("x") }, "b", new ast_1.Variable("y"), { "a": new ast_1.Variable("x"), "b": new ast_1.Variable("y") });
test_add_to_substitution("add_to_sub existing var no conflict", { "a": new ast_1.Variable("x") }, "a", new ast_1.Variable("x"), { "a": new ast_1.Variable("x") });
const conflicting_add_sub = { "a": new ast_1.Variable("x") };
test_add_to_substitution("add_to_sub existing var conflicts", conflicting_add_sub, "a", new ast_1.Variable("y"), new first_order_1.AddConflictingSubstitutionEntry(conflicting_add_sub, "a", new ast_1.Variable("x"), new ast_1.Variable("y")));
test_add_to_substitution("add_to_sub internal substitution", { "a": new ast_1.MetaVariable("x"), "b": new ast_1.MetaVariable("x") }, "x", new ast_1.Variable("z"), { "a": new ast_1.Variable("z"), "b": new ast_1.Variable("z"), "x": new ast_1.Variable("z") });
const c = (label) => new ast_1.Constant(label);
const c2 = (label) => new ast_1.Variable(label);
const v = (id) => new ast_1.MetaVariable(id);
const f = (head, arg0, ...args) => args.length === 0 ? new ast_1.Application(c(head), arg0)
    : args.length === 1 ? new ast_1.Application(new ast_1.Application(c(head), arg0), args[args.length - 1])
        : new ast_1.Application(f(head, arg0, args.splice(0, -1)), args[args.length - 1]);
const x = v("x");
const y = v("y");
const a = c2("a");
const b = c("b");
const f_a = f("f", a);
const f_x = f("f", x);
const f_y = f("f", y);
const f_y_z = f("f", y, v("z"));
const g_a = f("g", a);
const g_b = f("g", b);
const g_y = f("g", y);
const f_g_y = f("f", g_y);
const g_x_x = f("g", x, x);
const g_a_x = f("g", a, x);
const g_a_b = f("g", a, b);
const trivial = mk_sub([]);
function test_unify(name, t1, t2, expected) {
    const result = (0, first_order_1.unify)([{}, [[t1, t2]]]);
    test(`unify ${name}`, () => expect(result).toEqual(expected));
}
// mk_sub: [string, Term][] -> Substitution
function mk_sub(pairs) {
    const sub = (0, first_order_1.mk_default_substitution)(pairs);
    if (sub === undefined)
        throw new Error("Substitution is undefined");
    return sub;
}
test_unify("x =? x  -->  trivial", x, x, trivial);
test_unify("a =? x  -->  { x |-> a }", a, x, mk_sub([["x", a]]));
test_unify("x =? y  -->  { x |-> y }", x, y, mk_sub([["x", y]]));
test_unify("g(a, x) =? g(a, b)  -->  { x |-> b }", g_a_x, g_a_b, mk_sub([["x", b]]));
test_unify("f(a) =? g(a)  -->  undefined", f_a, g_a, new first_order_1.ConflictingEquations([{}, [[f_a, g_a]]], [[c("f"), c("g")]]));
test_unify("f(x) =? f(y)  -->  { x |-> y }", f_x, f_y, mk_sub([["x", y]]));
test_unify("f(x) =? g(y)  -->  undefined", f_x, g_y, new first_order_1.ConflictingEquations([{}, [[f_x, g_y]]], [[c("f"), c("g")]]));
test_unify("f(a) =? g(b)  -->  undefined", f_a, g_b, new first_order_1.ConflictingEquations([{}, [[f_a, g_b]]], [[c("f"), c("g")], [a, b]]));
test_unify("f(x) =? f(y, z)  -->  undefined", f_x, f_y_z, new first_order_1.ConflictingEquations([{}, [[f_x, f_y_z]]], [[c("f"), f_y]]));
test_unify("f(g(y)) =? f(x)  -->  { x |-> g(y)}", f_g_y, f_x, mk_sub([["x", g_y]]));
test_unify("x =? f(x)  -->  undefined", x, f_x, new first_order_1.RightContainsLeftVariable([{}, [[x, f_x]]], x, f_x));
{
    const f_g_y_y = f("f", g_y, y);
    const f_x_a = f("f", x, a);
    test_unify("f(g(y), y) =? f(x, a)  -->  { x |-> g(a), y |-> a }", f_g_y_y, f_x_a, mk_sub([["x", g_a], ["y", a]]));
    test_unify("f(x, a) =? f(g(y), y)  -->  { x |-> g(a), y |-> a }", f_x_a, f_g_y_y, mk_sub([["x", g_a], ["y", a]]));
}
// f(x, y) =? f(a, g(y))
const f_x_y = f("f", x, y);
const f_a_g_y = f("f", a, g_y);
test_unify("f(x, y) =? f(a, g(y))  -->  undefined", f_x_y, f_a_g_y, new first_order_1.RightContainsLeftVariable([{}, [[f_x_y, f_a_g_y]]], y, g_y));
// From a failed rule_test test.
const f_z_f_y_z = f("f", v("z"), f_y_z);
const f_a_a = f("f", a, a);
const f_a_f_f_a_a_a = f("f", a, f("f", f("f", a, a), a));
test_unify("f(z, f(y, z)) =? f(a, f(f(a, a), a))  -->  { y |-> f(a, a), z |-> a }", f_z_f_y_z, f_a_f_f_a_a_a, mk_sub([["y", f_a_a], ["z", a]]));
test_unify("f(a, f(f(a, a), a)) =? f(z, f(y, z))  -->  { y |-> f(a, a), z |-> a }", f_a_f_f_a_a_a, f_z_f_y_z, mk_sub([["y", f_a_a], ["z", a]]));
const f_b_a = f("f", b, a);
const f_a_f_b_a = f("f", a, f_b_a);
test_unify("f(a, f(b, a)) =? f(z, f(y, z))  -->  { y |-> b, z |-> a }", f_a_f_b_a, f_z_f_y_z, mk_sub([["y", b], ["z", a]]));
test_unify("f(z, f(y, z)) =? f(a, f(b, a))  -->  { y |-> b, z |-> a }", f_z_f_y_z, f_a_f_b_a, mk_sub([["y", b], ["z", a]]));
test_unify("f(y, z) =? f(b, a)  -->  { y |-> b, z |-> a }", f_b_a, f_y_z, mk_sub([["y", b], ["z", a]]));
// From a failed attach_tests test.
// I never tested the case in which a function on the left attempted to unify with an atom on the right.
test_unify("f(a) =? b  -->  undefined", f_a, b, new first_order_1.ConflictingEquations([{}, [[f_a, b]]], [[f_a, b]]));
test_unify("b =? f(a)  -->  undefined", b, f_a, new first_order_1.ConflictingEquations([{}, [[b, f_a]]], [[b, f_a]]));
// From a failed attach_tests test.
const z = v("z");
const g_y_z = f("g", y, z);
const left_j_unify_right_j_expected = (0, first_order_1.mk_default_substitution)([["x", z], ["y", z]]);
if (left_j_unify_right_j_expected === undefined)
    throw new Error("shouldn't happen");
test_unify("f(.x, .x) =? f(.y, .z)", g_x_x, g_y_z, left_j_unify_right_j_expected);
