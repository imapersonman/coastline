import { AddConflictingSubstitutionEntry, add_to_substitution, ConflictingEquations, mk_default_substitution, RightContainsLeftVariable, Substitution, UnificationError, unify } from "../../src/unification/first_order"
import { Application, Ast, Constant, MetaVariable, Variable } from "../../src/lambda_pi/ast"

function test_add_to_substitution(name: string, in_sub: Substitution, v_name: string, ast: Ast, output: Substitution | AddConflictingSubstitutionEntry) {
    const result = add_to_substitution(in_sub, v_name, ast)
    test(`add_to_substitution ${name}`, () => expect(result).toEqual(output))
}

test_add_to_substitution("add_to_sub empty sub",
    {}, "a", new Variable("x"), { "a": new Variable("x") })
test_add_to_substitution("add_to_sub non-empty sub success",
    { "a": new Variable("x") }, "b", new Variable("y"), { "a": new Variable("x"), "b": new Variable("y") })
test_add_to_substitution("add_to_sub existing var no conflict",
    { "a": new Variable("x") }, "a", new Variable("x"), { "a": new Variable("x") })
const conflicting_add_sub = { "a": new Variable("x") }
test_add_to_substitution("add_to_sub existing var conflicts",
    conflicting_add_sub, "a", new Variable("y"), new AddConflictingSubstitutionEntry(conflicting_add_sub, "a", new Variable("x"), new Variable("y")))
test_add_to_substitution("add_to_sub internal substitution",
    { "a": new MetaVariable("x"), "b": new MetaVariable("x") }, "x", new Variable("z"), { "a": new Variable("z"), "b": new Variable("z"), "x": new Variable("z") })

const c = (label: string) => new Constant(label)
const c2 = (label: string) => new Variable(label)
const v = (id: string) => new MetaVariable(id)
const f = (head: string, arg0: Ast, ...args: Ast[]): Ast =>
    args.length === 0 ? new Application(c(head), arg0)
    : args.length === 1 ? new Application(new Application(c(head), arg0), args[args.length - 1])
    : new Application(f(head, arg0, args.splice(0, -1)), args[args.length - 1])

const x = v("x")
const y = v("y")
const a = c2("a")
const b = c("b")
const f_a = f("f", a)
const f_x = f("f", x)
const f_y = f("f", y)
const f_y_z = f("f", y, v("z"))
const g_a = f("g", a)
const g_b = f("g", b)
const g_y = f("g", y)
const f_g_y = f("f", g_y)
const g_x_x = f("g", x, x)
const g_a_x = f("g", a, x)
const g_a_b = f("g", a, b)

const trivial = mk_sub([])

function test_unify(name: string, t1: Ast, t2: Ast, expected: Substitution | UnificationError) {
    const result = unify([{}, [[t1, t2]]])
    test(`unify ${name}`, () =>  expect(result).toEqual(expected))
}

// mk_sub: [string, Term][] -> Substitution
function mk_sub(pairs: [string, Ast][]): Substitution {
    const sub = mk_default_substitution(pairs)
    if (sub === undefined)
        throw new Error("Substitution is undefined")
    return sub
}

test_unify("x =? x  -->  trivial", x, x, trivial)
test_unify("a =? x  -->  { x |-> a }", a, x, mk_sub([["x", a]]))
test_unify("x =? y  -->  { x |-> y }", x, y, mk_sub([["x", y]]))
test_unify("g(a, x) =? g(a, b)  -->  { x |-> b }", g_a_x, g_a_b, mk_sub([["x", b]]))
test_unify("f(a) =? g(a)  -->  undefined", f_a, g_a, new ConflictingEquations([{}, [[f_a, g_a]]], [[c("f"), c("g")]]))
test_unify("f(x) =? f(y)  -->  { x |-> y }", f_x, f_y, mk_sub([["x", y]]))
test_unify("f(x) =? g(y)  -->  undefined", f_x, g_y, new ConflictingEquations([{}, [[f_x, g_y]]], [[c("f"), c("g")]]))
test_unify("f(a) =? g(b)  -->  undefined", f_a, g_b, new ConflictingEquations([{}, [[f_a, g_b]]], [[c("f"), c("g")], [a, b]]))
test_unify("f(x) =? f(y, z)  -->  undefined", f_x, f_y_z, new ConflictingEquations([{}, [[f_x, f_y_z]]], [[c("f"), f_y]]))
test_unify("f(g(y)) =? f(x)  -->  { x |-> g(y)}", f_g_y, f_x, mk_sub([["x", g_y]]))
test_unify("x =? f(x)  -->  undefined", x, f_x, new RightContainsLeftVariable([{}, [[x, f_x]]], x, f_x))
{const f_g_y_y = f("f", g_y, y)
const f_x_a = f("f", x, a)
test_unify("f(g(y), y) =? f(x, a)  -->  { x |-> g(a), y |-> a }", f_g_y_y, f_x_a, mk_sub([["x", g_a], ["y", a]]))
test_unify("f(x, a) =? f(g(y), y)  -->  { x |-> g(a), y |-> a }", f_x_a, f_g_y_y, mk_sub([["x", g_a], ["y", a]]))}

// f(x, y) =? f(a, g(y))
const f_x_y = f("f", x, y)
const f_a_g_y = f("f", a, g_y)
test_unify("f(x, y) =? f(a, g(y))  -->  undefined", f_x_y, f_a_g_y, new RightContainsLeftVariable([{}, [[f_x_y, f_a_g_y]]], y, g_y))

// From a failed rule_test test.
const f_z_f_y_z = f("f", v("z"), f_y_z)
const f_a_a = f("f", a, a)
const f_a_f_f_a_a_a = f("f", a, f("f", f("f", a, a), a))
test_unify("f(z, f(y, z)) =? f(a, f(f(a, a), a))  -->  { y |-> f(a, a), z |-> a }", f_z_f_y_z, f_a_f_f_a_a_a, mk_sub([["y", f_a_a], ["z", a]]))
test_unify("f(a, f(f(a, a), a)) =? f(z, f(y, z))  -->  { y |-> f(a, a), z |-> a }", f_a_f_f_a_a_a, f_z_f_y_z, mk_sub([["y", f_a_a], ["z", a]]))
const f_b_a = f("f", b, a)
const f_a_f_b_a = f("f", a, f_b_a)
test_unify("f(a, f(b, a)) =? f(z, f(y, z))  -->  { y |-> b, z |-> a }", f_a_f_b_a, f_z_f_y_z, mk_sub([["y", b], ["z", a]]))
test_unify("f(z, f(y, z)) =? f(a, f(b, a))  -->  { y |-> b, z |-> a }", f_z_f_y_z, f_a_f_b_a, mk_sub([["y", b], ["z", a]]))
test_unify("f(y, z) =? f(b, a)  -->  { y |-> b, z |-> a }", f_b_a, f_y_z, mk_sub([["y", b], ["z", a]]))

// From a failed attach_tests test.
// I never tested the case in which a function on the left attempted to unify with an atom on the right.
test_unify("f(a) =? b  -->  undefined", f_a, b, new ConflictingEquations([{}, [[f_a, b]]], [[f_a, b]]))
test_unify("b =? f(a)  -->  undefined", b, f_a, new ConflictingEquations([{}, [[b, f_a]]], [[b, f_a]]))

// From a failed attach_tests test.
const z = v("z")
const g_y_z = f("g", y, z)
const left_j_unify_right_j_expected = mk_default_substitution([["x", z], ["y", z]])
if (left_j_unify_right_j_expected === undefined) throw new Error("shouldn't happen")
test_unify("f(.x, .x) =? f(.y, .z)", g_x_x, g_y_z, left_j_unify_right_j_expected)