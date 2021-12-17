import { binders_of_type_similar } from "../../src/lambda_pi/alpha-equality"
import { Application, Ast, Constant, MetaVariable, Variable } from "../../src/lambda_pi/ast"
import { Binder, is_application, is_binder, is_constant, is_meta_variable, is_variable } from "../../src/lambda_pi/utilities"
import { AddConflictingSubstitutionEntry, add_to_substitution, ConflictingEquations, mk_default_substitution, RightContainsLeftVariable, simply_add_to_substitution, Substitution, UnificationError } from "../../src/unification/first_order"
import { beta_eta_equality } from "../../src/lambda_pi/beta_eta_equality"
import { match } from "../../src/unification/first_order_match"

const c = (label: string) => new Constant(label)
const c2 = (label: string) => new Variable(label)
const v = (id: string) => new MetaVariable(id)
const f = (head: string, arg0: Ast, ...args: Ast[]) =>
    args.length === 0 ? new Application(c(head), arg0)
    : args.length === 1 ? new Application(new Application(c(head), arg0), args[args.length - 1])
    : new Application(f(head, arg0, args.splice(0, -1)), args[args.length - 1])

const x = v("x")
const y = v("y")
const z = v("z")
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

class LeftConstantDoesNotMatchRight { constructor(readonly l: Constant | Variable, readonly r: Ast) {} }
const is_left_constant_does_not_match_right = (e: unknown): e is LeftConstantDoesNotMatchRight => e instanceof LeftConstantDoesNotMatchRight
class RedeclaredMatchVariable { constructor(readonly v: MetaVariable, readonly previous_value: Ast, readonly new_value: Ast) {} }
const is_redeclared_match_variable = (e: unknown): e is RedeclaredMatchVariable => e instanceof RedeclaredMatchVariable
class ApplicationHeadError { constructor(readonly head_error: MatchError, readonly arg_match_or_error: Substitution | MatchError) {} }
const is_application_head_error = (e: unknown): e is ApplicationHeadError => e instanceof ApplicationHeadError
class ApplicationArgError { constructor(readonly head_match: Substitution, readonly arg_error: MatchError) {} }
const is_application_arg_error = (e: unknown): e is ApplicationArgError => e instanceof ApplicationArgError
class LeftApplicationDoesNotMatchRight { constructor(readonly l: Application, readonly r: Ast) {} }
const is_left_application_does_not_match_right = (e: unknown): e is LeftApplicationDoesNotMatchRight => e instanceof LeftApplicationDoesNotMatchRight
class LeftAndRightAreDifferentBinders { constructor(readonly l: Binder, r: Binder) {} }
const is_left_and_right_are_different_binders = (e: unknown): e is LeftAndRightAreDifferentBinders => e instanceof LeftAndRightAreDifferentBinders
class BinderTypeError { constructor(readonly type_error: MatchError, readonly scope_match_or_error: Substitution | MatchError) {} }
const is_binder_type_error = (e: unknown): e is BinderTypeError => e instanceof BinderTypeError
class BinderScopeError { constructor(readonly type_match: Substitution, readonly scope_error: MatchError) {} }
const is_binder_scope_error = (e: unknown): e is BinderScopeError => e instanceof BinderScopeError
type MatchError =
    | LeftConstantDoesNotMatchRight
    | RedeclaredMatchVariable
    | ApplicationHeadError
    | ApplicationArgError
    | LeftApplicationDoesNotMatchRight
    | LeftAndRightAreDifferentBinders
    | BinderTypeError
    | BinderScopeError
const is_match_error = (e: unknown): e is MatchError =>
    is_left_constant_does_not_match_right(e)
    || is_redeclared_match_variable(e)
    || is_application_head_error(e)
    || is_application_arg_error(e)
    || is_left_application_does_not_match_right(e)
    || is_left_and_right_are_different_binders(e)
    || is_binder_type_error(e)
    || is_binder_scope_error(e)

function test_match(name: string, t1: Ast, t2: Ast, expected: Substitution | MatchError) {
    const result = match(t1, t2)
    test(`match ${name}`, () =>  expect(result).toEqual(expected))
}

// mk_sub: [string, Term][] -> Substitution
function mk_sub(pairs: [string, Ast][]): Substitution {
    const sub = mk_default_substitution(pairs)
    if (sub === undefined)
        throw new Error("Substitution is undefined")
    return sub
}

test_match("x =? x  -->  { x |-> x }", x, x, mk_sub([["x", x]]))
// DIFFERENT FOR MATCH (should be undefined, because a is not a MetaVariable and x is not equal to a)
test_match("a =? x  -->  undefined", a, x, new LeftConstantDoesNotMatchRight(a, x))
test_match("x =? y  -->  { x |-> y }", x, y, mk_sub([["x", y]]))
// ADDED FOR MATCH (and should be in unify, too)
test_match("a =? b  -->  undefined", a, b, new LeftConstantDoesNotMatchRight(a, b))
test_match("g(a, x) =? g(a, b)  -->  { x |-> b }", g_a_x, g_a_b, mk_sub([["x", b]]))
test_match("f(a) =? g(a)  -->  undefined", f_a, g_a, new ApplicationHeadError(new LeftConstantDoesNotMatchRight(c("f"), c("g")), {}))
test_match("f(x) =? f(y)  -->  { x |-> y }", f_x, f_y, mk_sub([["x", y]]))
test_match("f(x) =? g(y)  -->  undefined", f_x, g_y, new ApplicationHeadError(new LeftConstantDoesNotMatchRight(c("f"), c("g")), mk_sub([["x", y]])))
test_match("f(a) =? g(b)  -->  undefined", f_a, g_b, new ApplicationHeadError(new LeftConstantDoesNotMatchRight(c("f"), c("g")), new LeftConstantDoesNotMatchRight(a, b)))
// (f x) =? ((f y) z)
test_match("f(x) =? f(y, z)  -->  undefined", f_x, f_y_z, new ApplicationHeadError(new LeftConstantDoesNotMatchRight(c("f"), f_y), mk_sub([["x", z]])))
// DIFFERENT FOR MATCH (should be undefined, because x is not an application)
// ExpectedApplicationOnRight
// (f (g y)) =? (f x)
test_match("f(g(y)) =? f(x)  -->  undefined", f_g_y, f_x, new ApplicationArgError(mk_sub([]), new LeftApplicationDoesNotMatchRight(g_y, x)))
// DIFFERENT FOR MATCH (should be { x |-> f(x) })
test_match("x =? f(x)  -->  { x |-> f(x) }", x, f_x, mk_sub([["x", f_x]]))
// ADDED FOR MATCH
// ((g x) x) =? ((g a) x)
test_match("g(x, x) =? g(a, b)  -->  undefined", g_x_x, g_a_b, new ApplicationArgError(mk_sub([["x", a]]), new RedeclaredMatchVariable(x, a, b)))
{
    const f_g_y_y = f("f", g_y, y)
    const f_x_a = f("f", x, a)
    // DIFFERENT FOR MATCH (should be undefined, x is not an application)
    // ((f (g y)) y) =? ((f x) a)
    test_match("f(g(y), y) =? f(x, a)  -->  undefined", f_g_y_y, f_x_a, new ApplicationHeadError(new ApplicationArgError(mk_sub([]), new LeftApplicationDoesNotMatchRight(g_y, x)), mk_sub([["y", a]])))
    // DIFFERENT FOR MATCH (should be undefined, because a is a constant and can't be assigned to something it's not equal to)
    // ((f x) a) =? ((f (g y)) y)
    test_match("f(x, a) =? f(g(y), y)  -->  undefined", f_x_a, f_g_y_y, new ApplicationArgError(mk_sub([["x", g_y]]), new LeftConstantDoesNotMatchRight(a, y)))
    const f_x_y = f("f", x, y)
    const f_g_y_a = f("f", f("g", y), a)
    // x |-> g(y)
    // y |-> a
    // THE ACTUAL MATCH TEST
    // ((f x) y) =? ((f (g y)) a)
    test_match("f(x, y) =? f(g(y), a)  -->  { x |-> g(y), y |-> a }", f_x_y, f_g_y_a, mk_sub([["x", g_y], ["y", a]]))
}

// f(x, y) =? f(a, g(y))
const f_x_y = f("f", x, y)
const f_a_g_y = f("f", a, g_y)
// x |-> a
// y |-> g(y)
// DIFFERENT FOR MATCH (occurs check doesn't actually happen)
test_match("f(x, y) =? f(a, g(y))  -->  undefined", f_x_y, f_a_g_y, mk_sub([["x", a], ["y", g_y]]))

// TODO: Test Binders (aahahhh!)

/*
// From a failed rule_test test.
const f_z_f_y_z = f("f", v("z"), f_y_z)
const f_a_a = f("f", a, a)
const f_a_f_f_a_a_a = f("f", a, f("f", f("f", a, a), a))
test_match("f(z, f(y, z)) =? f(a, f(f(a, a), a))  -->  { y |-> f(a, a), z |-> a }", f_z_f_y_z, f_a_f_f_a_a_a, mk_sub([["y", f_a_a], ["z", a]]))
test_match("f(a, f(f(a, a), a)) =? f(z, f(y, z))  -->  { y |-> f(a, a), z |-> a }", f_a_f_f_a_a_a, f_z_f_y_z, mk_sub([["y", f_a_a], ["z", a]]))
const f_b_a = f("f", b, a)
const f_a_f_b_a = f("f", a, f_b_a)
test_match("f(a, f(b, a)) =? f(z, f(y, z))  -->  { y |-> b, z |-> a }", f_a_f_b_a, f_z_f_y_z, mk_sub([["y", b], ["z", a]]))
test_match("f(z, f(y, z)) =? f(a, f(b, a))  -->  { y |-> b, z |-> a }", f_z_f_y_z, f_a_f_b_a, mk_sub([["y", b], ["z", a]]))
test_match("f(y, z) =? f(b, a)  -->  { y |-> b, z |-> a }", f_b_a, f_y_z, mk_sub([["y", b], ["z", a]]))

// From a failed attach_tests test.
// I never tested the case in which a function on the left attempted to unify with an atom on the right.
test_match("f(a) =? b  -->  undefined", f_a, b, new ConflictingEquations([{}, [[f_a, b]]], [[f_a, b]]))
test_match("b =? f(a)  -->  undefined", b, f_a, new ConflictingEquations([{}, [[b, f_a]]], [[b, f_a]]))

// From a failed attach_tests test.
const z = v("z")
const g_y_z = f("g", y, z)
const left_j_unify_right_j_expected = mk_default_substitution([["x", z], ["y", z]])
if (left_j_unify_right_j_expected === undefined) throw new Error("shouldn't happen")
test_match("f(.x, .x) =? f(.y, .z)", g_x_x, g_y_z, left_j_unify_right_j_expected)
*/