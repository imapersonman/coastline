import { Ast } from "../../src/lambda_pi/ast";
import { perm, permutation } from "../../src/lambda_pi/permutation";
import { app, con, la, mvlist, ovlist, pi, sus, type_k } from "../../src/lambda_pi/shorthands";
import { linked_list } from "../../src/linked_list";
import { apply_meta_substitution_to_ast, apply_meta_substitution_to_constraints, apply_meta_substitution_to_equational_constraint, apply_meta_substitution_to_freshness_constraint, apply_meta_substitution_to_freshness_environment, apply_meta_substitution_to_meta_variable, apply_meta_substitution_to_problem, atoms_are_not_equal, atom_not_fresh, cannot_unify_different_kinds_of_binders, compose_meta_substitutions, convert_meta_variables_to_suspensions, empty_problem, EquationalConstraint, eq_c, extend_problem, failed_occurs_check, FreshnessConstraint, fr_c, is_abstractions_equation, is_abstraction_freshness, is_applications_equation, is_application_freshness, is_atoms_equation, is_atom_freshness, is_left_suspension_equation, is_right_suspension_equation, is_suspensions_with_same_meta_variable_equation, is_suspension_freshness, meta_substitution, meta_variable_or_suspension_to_suspension, next_constraint_from_problem, NominalConstraint, nominal_unify, no_case_for_equation, possibly_extend_problem, step_abstractions_equation, step_applications_equation, step_atoms_equation, step_fresh_in_abstraction, step_fresh_in_application, step_fresh_in_atom, step_fresh_in_suspension, step_left_suspension_equation, step_right_suspension_equation_for_matching, step_right_suspension_equation_for_unification, step_suspensions_with_same_meta_variable_equation, suspension_on_right_side_while_matching } from "../../src/unification/nominal";

const empty_ms = meta_substitution()
const [X, Y, Z, W] = mvlist('X', 'Y', 'Z', 'W')
const [a, b, c] = ovlist('a', 'b', 'c')

describe('compose_meta_substitutions', () => {
    test('add single to empty', () => expect(compose_meta_substitutions(empty_ms, meta_substitution([X, a]))).toEqual(meta_substitution([X, a])))
    test('add single to non-empty w/o new variable', () => expect(compose_meta_substitutions(meta_substitution([X, a]), meta_substitution([Y, b]))).toEqual(meta_substitution([X, a], [Y, b])))
    test('add single to non-empty w new variable', () => expect(compose_meta_substitutions(meta_substitution([X, app(Y, a)]), meta_substitution([Y, b]))).toEqual(meta_substitution([X, app(b, a)], [Y, b])))
    test('add single to 3 element sub', () => expect(
        compose_meta_substitutions(meta_substitution([X, app(b, W)], [Y, app(a, b)], [Z, W]), meta_substitution([W, c]))
    ).toEqual(
        meta_substitution([X, app(b, c)], [Y, app(a, b)], [Z, c], [W, c])
    ))
    test('add 2 element to disjoint 2 element sub', () => expect(
        compose_meta_substitutions(meta_substitution([X, Z], [Y, W]), meta_substitution([W, b], [Z, a]))
    ).toEqual(
        meta_substitution([X, a], [Y, b], [W, b], [Z, a])
    ))
    test('add 3 elements to overlapping 3 element sub', () => expect(
        // this one's a bit subtle since Z is overridden AND overlaps.
        compose_meta_substitutions(meta_substitution([X, Y], [Z, W]), meta_substitution([W, a], [Z, b], [Y, c]))
    ).toEqual(
        // Z is removed from second substitution because it is encountered in the first, even though they disagree.
        // This is possible because single substitutions apply from left to right, so Z is eliminated from any ast
        // before the second Z is encountered (assuming the entire substitution remained).
        meta_substitution([X, c], [Z, a], [W, a], [Y, c])
    ))
})

describe('apply_meta_substitution_to_meta_variable', () => {
    const contains_all_mvs = meta_substitution([W, a], [X, b], [Y, app(a, b)], [Z, c])
    const missing_mv = meta_substitution([X, a], [W, b], [Y, c])
    test('empty', () => expect(apply_meta_substitution_to_meta_variable(empty_ms, X)).toEqual(X))
    test('non-empty, missing', () => expect(apply_meta_substitution_to_meta_variable(missing_mv, Z)).toEqual(Z))
    test('non-empty, containing', () => expect(apply_meta_substitution_to_meta_variable(contains_all_mvs, Z)).toEqual(c))
})

describe('apply_meta_substitution_to_ast', () => {
    const arbitrary = meta_substitution([X, a], [Y, b], [Z, c])
    test('empty', () => expect(apply_meta_substitution_to_ast(empty_ms, app(X, b))).toEqual(app(X, b)))
    // TypeKind
    test('arbitrary, typek', () => expect(apply_meta_substitution_to_ast(arbitrary, type_k)).toEqual(type_k))
    // Constant
    test('arbitrary, constant', () => expect(apply_meta_substitution_to_ast(arbitrary, con('R'))).toEqual(con('R')))
    // Variable
    test('arbitrary, variable', () => expect(apply_meta_substitution_to_ast(arbitrary, a)).toEqual(a))
    // MetaVariable
    test('not containing meta variable', () => expect(apply_meta_substitution_to_ast(arbitrary, W)).toEqual(W))
    test('containing meta variable', () => expect(apply_meta_substitution_to_ast(arbitrary, Y)).toEqual(b))
    test('containing meta variable to suspension', () => expect(apply_meta_substitution_to_ast(meta_substitution([Y, sus(perm([b, a]), X)]), Y)).toEqual(sus(perm([b, a]), X)))
    // Suspension
    test('suspension not containing meta variable', () => expect(apply_meta_substitution_to_ast(arbitrary, W)).toEqual(W))
    test('suspension containing meta variable no swap', () => expect(apply_meta_substitution_to_ast(arbitrary, sus(permutation([a, c]), Y))).toEqual(b))
    test('suspension containing meta variable with swap', () => expect(apply_meta_substitution_to_ast(arbitrary, sus(permutation([a, c]), Z))).toEqual(a))
    test('suspension containing meta variable, to meta variable', () => expect(apply_meta_substitution_to_ast(meta_substitution([W, Z]), sus(perm([a, c]), W))).toEqual(sus(permutation([a, c]), Z)))
    test('suspension containing meta variable, to suspension', () => expect(apply_meta_substitution_to_ast(meta_substitution([W, sus(perm([b, c]), X)]), sus(perm([a, c]), W))).toEqual(sus(perm([a, c], [b, c]), X)))
    // Application
    test('arbitrary, application', () => expect(
        apply_meta_substitution_to_ast(arbitrary, app(app(W, X), app(Y, Z)))
    ).toEqual(
        app(app(W, a), app(b, c))
    ))
    // Lambda
    test('arbitrary, lambda', () => expect(
        apply_meta_substitution_to_ast(arbitrary, la(a, app(Z, Y), app(X, W)))
    ).toEqual(
        la(a, app(c, b), app(a, W))
    ))
    // Pi
    test('arbitrary, pi', () => expect(
        apply_meta_substitution_to_ast(arbitrary, pi(a, app(Z, Y), app(X, W)))
    ).toEqual(
        pi(a, app(c, b), app(a, W))
    ))
})

describe('apply_meta_substitution_to_equational_constraint', () => {
    const arbitrary = meta_substitution([X, a], [W, app(a, b)], [Z, app(c, a)], [Y, b])
    test('left only', () => expect(apply_meta_substitution_to_equational_constraint(arbitrary, eq_c(W, a))).toEqual(eq_c(app(a, b), a)))
    test('right only', () => expect(apply_meta_substitution_to_equational_constraint(arbitrary, eq_c(b, Y))).toEqual(eq_c(b, b)))
    test('both sides', () => expect(
        apply_meta_substitution_to_equational_constraint(arbitrary, eq_c(app(X, Y), app(Z, W)))
    ).toEqual(
        eq_c(app(a, b), app(app(c, a), app(a, b)))
    ))
})

describe('apply_meta_substitution_to_freshness_constraint', () => {
    const arbitrary = meta_substitution([X, a], [W, app(a, b)], [Z, app(c, a)], [Y, b])
    test('no change', () => expect(apply_meta_substitution_to_freshness_constraint(arbitrary, fr_c(a, b))).toEqual(fr_c(a, b)))
    test('a # X', () => expect(apply_meta_substitution_to_freshness_constraint(arbitrary, fr_c(a, X))).toEqual(fr_c(a, a)))
    test('b # (X Z)', () => expect(apply_meta_substitution_to_freshness_constraint(arbitrary, fr_c(b, app(X, Z)))).toEqual(fr_c(b, app(a, app(c, a)))))
})


describe('apply_meta_substitution_to_constraints', () => {
    const arbitrary = meta_substitution([X, a], [W, app(a, b)], [Z, app(c, a)], [Y, b])
    test('no change', () => expect(
        apply_meta_substitution_to_constraints(arbitrary, linked_list<NominalConstraint>(eq_c(a, b), fr_c(b, c), eq_c(a, a)))
    ).toEqual(
        linked_list<NominalConstraint>(eq_c(a, b), fr_c(b, c), eq_c(a, a))
    ))
    test('change all', () => expect(
        apply_meta_substitution_to_constraints(arbitrary, linked_list<NominalConstraint>(eq_c(X, b), fr_c(b, Y), eq_c(Z, W)))
    ).toEqual(
        linked_list<NominalConstraint>(eq_c(a, b), fr_c(b, b), eq_c(app(c, a), app(a, b)))
    ))
})

describe('meta_variable_or_suspension_to_suspension', () => {
    test('X', () => expect(meta_variable_or_suspension_to_suspension(X)).toEqual(sus(permutation(), X)))
    test('Y', () => expect(meta_variable_or_suspension_to_suspension(Y)).toEqual(sus(permutation(), Y)))
    test('(a b)(c b)•X', () => expect(meta_variable_or_suspension_to_suspension(sus(permutation([a, b], [c, b]), X))).toEqual(sus(permutation([a, b], [c, b]), X)))
})

describe('apply_meta_substitution_to_freshness_environment', () => {
    const arbitrary = meta_substitution([Z, app(a, c)], [Y, c], [X, app(b, c)])
    const Z_swaps_to_W = meta_substitution([Z, W], [Y, c], [X, app(b, c)])
    test('no change', () => expect(
        apply_meta_substitution_to_freshness_environment(meta_substitution([X, a], [Y, b]), linked_list([a, sus(perm(), W)], [b, sus(perm(), Z)]))
    ).toEqual(
        [linked_list(), linked_list([a, sus(perm(), W)], [b, sus(perm(), Z)])]
    ))
    test('change some', () => expect(
        // c # Z changes to c # W because a meta_variable is swapped to a meta_variable.  This might have
        // weird implications but
        apply_meta_substitution_to_freshness_environment(Z_swaps_to_W, linked_list([a, sus(perm(), Y)], [b, W], [c, sus(perm(), Z)]))
    ).toEqual(
        [linked_list<FreshnessConstraint<Ast>>(fr_c(a, c)), linked_list([b, W], [c, sus(perm(), W)])]
    ))
    test('change all', () => expect(
        apply_meta_substitution_to_freshness_environment(arbitrary, linked_list([a, Y], [c, Z], [b, X]))
    ).toEqual(
        [linked_list<FreshnessConstraint<Ast>>(fr_c(a, c), fr_c(c, app(a, c)), fr_c(b, app(b, c))), linked_list()]
    ))
})

describe('apply_meta_substitution_to_problem', () => {
    const arbitrary = meta_substitution([Z, a], [Y, b], [W, c])
    test('no change', () => expect(
        apply_meta_substitution_to_problem(arbitrary, {
            equations: linked_list(eq_c(a, b), eq_c(b, b)),
            freshnesses: linked_list(fr_c(c, X)),
            substitution: meta_substitution([W, a], [Y, b], [Z, a]),
            freshness_environment: linked_list([a, sus(perm(), X)])
        })
    ).toEqual({
        equations: linked_list(eq_c(a, b), eq_c(b, b)),
        freshnesses: linked_list(fr_c(c, X)),
        substitution: meta_substitution([W, a], [Y, b], [Z, a]),
        freshness_environment: linked_list([a, sus(perm(), X)])
    }))
    test('just equations change', () => expect(
        apply_meta_substitution_to_problem(arbitrary, {
            equations: linked_list(eq_c(W, Y), eq_c(Y, Z)),
            freshnesses: linked_list(fr_c(c, X)),
            substitution: meta_substitution([W, a], [Y, b], [Z, a]),
            freshness_environment: linked_list([a, sus(perm(), X)])
        })
    ).toEqual({
        equations: linked_list(eq_c(c, b), eq_c(b, a)),
        freshnesses: linked_list(fr_c(c, X)),
        substitution: meta_substitution([W, a], [Y, b], [Z, a]),
        freshness_environment: linked_list([a, sus(perm(), X)])
    }))
    test('just freshnesses change', () => expect(
        apply_meta_substitution_to_problem(arbitrary, {
            equations: linked_list(eq_c(a, b), eq_c(b, b)),
            freshnesses: linked_list(fr_c(c, W)),
            substitution: meta_substitution([W, a], [Y, b], [Z, a]),
            freshness_environment: linked_list([a, sus(perm(), X)])
        })
    ).toEqual({
        equations: linked_list(eq_c(a, b), eq_c(b, b)),
        freshnesses: linked_list(fr_c(c, c)),
        substitution: meta_substitution([W, a], [Y, b], [Z, a]),
        freshness_environment: linked_list([a, sus(perm(), X)])
    }))
    test('just substitution changes', () => expect(
        apply_meta_substitution_to_problem(arbitrary, {
            equations: linked_list(eq_c(a, b), eq_c(b, b)),
            freshnesses: linked_list(fr_c(c, X)),
            substitution: meta_substitution([X, a]),
            freshness_environment: linked_list([a, sus(perm(), X)])
        })
    ).toEqual({
        equations: linked_list(eq_c(a, b), eq_c(b, b)),
        freshnesses: linked_list(fr_c(c, X)),
        substitution: meta_substitution([X, a], [Z, a], [Y, b], [W, c]),
        freshness_environment: linked_list([a, sus(perm(), X)])
    }))
    test('just freshness environment changes', () => expect(
        apply_meta_substitution_to_problem(meta_substitution([X, W]), {
            equations: linked_list(eq_c(a, b), eq_c(b, b)),
            freshnesses: linked_list(fr_c(c, Z)),
            substitution: meta_substitution([W, a], [Y, b], [Z, a]),
            freshness_environment: linked_list([a, sus(perm(), X)])
        })
    ).toEqual({
        equations: linked_list(eq_c(a, b), eq_c(b, b)),
        freshnesses: linked_list(fr_c(c, Z)),
        substitution: meta_substitution([W, a], [Y, b], [Z, a], [X, W]),
        freshness_environment: linked_list([a, sus(perm(), W)])
    }))
    test('freshness environment and freshnesses change', () => expect(
        apply_meta_substitution_to_problem(arbitrary, {
            equations: linked_list(eq_c(a, b), eq_c(b, b)),
            freshnesses: linked_list(fr_c(c, X)),
            substitution: meta_substitution([W, a], [Y, b], [Z, a]),
            freshness_environment: linked_list([a, sus(perm(), W)])
        })
    ).toEqual({
        equations: linked_list(eq_c(a, b), eq_c(b, b)),
        freshnesses: linked_list(fr_c(c, X), fr_c(a, c)),
        substitution: meta_substitution([W, a], [Y, b], [Z, a]),
        freshness_environment: linked_list()
    }))
    test('all change', () => expect(
        apply_meta_substitution_to_problem(arbitrary, {
            equations: linked_list(eq_c(X, Y), eq_c(W, Z)),
            freshnesses: linked_list(fr_c(c, Y)),
            substitution: meta_substitution(),
            freshness_environment: linked_list([a, sus(perm(), W)])
        })
    ).toEqual({
        equations: linked_list(eq_c(X, b), eq_c(c, a)),
        freshnesses: linked_list(fr_c(c, b), fr_c(a, c)),
        substitution: meta_substitution([Z, a], [Y, b], [W, c]),
        freshness_environment: linked_list()
    }))
})

describe('convert_meta_variables_to_suspensions', () => {
    test('TypeKind', () => expect(convert_meta_variables_to_suspensions(type_k)).toEqual(type_k))
    test('Variable', () => expect(convert_meta_variables_to_suspensions(a)).toEqual(a))
    test('Constant', () => expect(convert_meta_variables_to_suspensions(con('t'))).toEqual(con('t')))
    test('Suspension', () => expect(convert_meta_variables_to_suspensions(sus(perm(), X))).toEqual(sus(perm(), X)))
    test('MetaVariable X', () => expect(convert_meta_variables_to_suspensions(X)).toEqual(sus(perm(), X)))
    test('MetaVariable Y', () => expect(convert_meta_variables_to_suspensions(Y)).toEqual(sus(perm(), Y)))
    test('Application', () => expect(convert_meta_variables_to_suspensions(app(X, Y))).toEqual(app(sus(perm(), X), sus(perm(), Y))))
    test('Lambda', () => expect(convert_meta_variables_to_suspensions(la(a, app(X, Y), app(Z, W)))).toEqual(la(a, app(sus(perm(), X), sus(perm(), Y)), app(sus(perm(), Z), sus(perm(), W)))))
    test('Pi', () => expect(convert_meta_variables_to_suspensions(pi(a, app(X, Y), app(Z, W)))).toEqual(pi(a, app(sus(perm(), X), sus(perm(), Y)), app(sus(perm(), Z), sus(perm(), W)))))
})

describe('extend_problem', () => {
    test('no change', () => expect(
        extend_problem(
            {
                equations: linked_list(eq_c(a, b), eq_c(b, c)),
                freshnesses: linked_list<FreshnessConstraint<Ast>>(fr_c(a, X), fr_c(b, app(a, b))),
                substitution: meta_substitution([X, a], [Y, b]),
                freshness_environment: linked_list([a, W], [b, Z], [c, Y])
            },
            {
                equations: linked_list(),
                freshnesses: linked_list(),
                substitution: meta_substitution(),
                freshness_environment: linked_list()
            }
        )
    ).toEqual({
        equations: linked_list(eq_c(a, b), eq_c(b, c)),
        freshnesses: linked_list<FreshnessConstraint<Ast>>(fr_c(a, X), fr_c(b, app(a, b))),
        substitution: meta_substitution([X, a], [Y, b]),
        freshness_environment: linked_list([a, W], [b, Z], [c, Y])
    }))
    test('just equations change', () => expect(
        extend_problem(
            {
                equations: linked_list(eq_c(a, b), eq_c(b, c)),
                freshnesses: linked_list<FreshnessConstraint<Ast>>(fr_c(a, X), fr_c(b, app(a, b))),
                substitution: meta_substitution([Z, a], [Y, b]),
                freshness_environment: linked_list([a, W], [b, W], [c, W])
            },
            // all fields should be unioned (sort of) together, so the following extension should still
            // only result in a change to equations.
            {
                equations: linked_list(eq_c(c, c), eq_c(b, b)),
                freshnesses: linked_list<FreshnessConstraint<Ast>>(fr_c(a, X), fr_c(b, app(a, b))),
                substitution: meta_substitution([Z, a], [Y, b]),
                freshness_environment: linked_list([a, W], [b, W], [c, W])
            }
        )
    ).toEqual({
        equations: linked_list(eq_c(a, b), eq_c(b, c), eq_c(c, c), eq_c(b, b)),
        freshnesses: linked_list<FreshnessConstraint<Ast>>(fr_c(a, X), fr_c(b, app(a, b))),
        substitution: meta_substitution([Z, a], [Y, b]),
        freshness_environment: linked_list([a, W], [b, W], [c, W])
    }))
    test('just freshnesses change', () => expect(
        extend_problem(
            {
                equations: linked_list(eq_c(a, b), eq_c(b, c)),
                freshnesses: linked_list<FreshnessConstraint<Ast>>(fr_c(a, X), fr_c(b, app(a, b))),
                substitution: meta_substitution([Z, a], [Y, b]),
                freshness_environment: linked_list([a, W], [b, W], [c, W])
            },
            {
                equations: linked_list(eq_c(a, b), eq_c(b, c)),
                freshnesses: linked_list(fr_c(c, c)),
                substitution: meta_substitution([Z, a], [Y, b]),
                freshness_environment: linked_list([a, W], [b, W], [c, W])
            }
        )
    ).toEqual({
        equations: linked_list(eq_c(a, b), eq_c(b, c)),
        freshnesses: linked_list<FreshnessConstraint<Ast>>(fr_c(a, X), fr_c(b, app(a, b)), fr_c(c, c)),
        substitution: meta_substitution([Z, a], [Y, b]),
        freshness_environment: linked_list([a, W], [b, W], [c, W])
    }))
    test('just the substitution changes', () => expect(
        extend_problem(
            {
                equations: linked_list(eq_c(a, b), eq_c(b, c)),
                freshnesses: linked_list<FreshnessConstraint<Ast>>(fr_c(a, X), fr_c(b, app(a, b))),
                substitution: meta_substitution([X, a], [Y, b]),
                freshness_environment: linked_list([a, W], [b, W], [c, W])
            },
            {
                equations: linked_list(eq_c(b, c)),
                freshnesses: linked_list<FreshnessConstraint<Ast>>(fr_c(a, X), fr_c(b, app(a, b))),
                substitution: meta_substitution([Y, b], [Z, c]),
                freshness_environment: linked_list([c, W])
            }
        )
    ).toEqual({
        equations: linked_list(eq_c(a, b), eq_c(b, c)),
        freshnesses: linked_list<FreshnessConstraint<Ast>>(fr_c(a, X), fr_c(b, app(a, b))),
        substitution: meta_substitution([X, a], [Y, b], [Z, c]),
        freshness_environment: linked_list([a, W], [b, W], [c, W])
    }))
    test('substitution changes, which is the only effect on the other fields', () => expect(
        extend_problem(
            {
                equations: linked_list<EquationalConstraint<Ast, Ast>>(eq_c(Z, b), eq_c(b, Z)),
                freshnesses: linked_list<FreshnessConstraint<Ast>>(fr_c(a, X), fr_c(b, Z)),
                substitution: meta_substitution([X, Z]),
                freshness_environment: linked_list([a, W], [b, W], [c, Z])
            },
            {
                equations: linked_list(),
                freshnesses: linked_list<FreshnessConstraint<Ast>>(fr_c(a, X)),
                substitution: meta_substitution([Z, c]),
                freshness_environment: linked_list([a, W])
            }
        )
    ).toEqual({
        equations: linked_list<EquationalConstraint<Ast, Ast>>(eq_c(c, b), eq_c(b, c)),
        freshnesses: linked_list<FreshnessConstraint<Ast>>(fr_c(a, X), fr_c(b, c), fr_c(c, c)),
        substitution: meta_substitution([X, c], [Z, c]),
        freshness_environment: linked_list([a, W], [b, W])
    }))
    test('just the freshness_environment changes', () => expect(
        extend_problem(
            {
                equations: linked_list(eq_c(a, b), eq_c(b, c)),
                freshnesses: linked_list<FreshnessConstraint<Ast>>(fr_c(a, X), fr_c(b, app(a, b))),
                substitution: meta_substitution([X, a], [Y, b]),
                freshness_environment: linked_list([a, W], [b, Z], [c, Y])
            },
            {
                equations: linked_list(),
                freshnesses: linked_list(),
                substitution: meta_substitution(),
                freshness_environment: linked_list([b, X])
            }
        )
    ).toEqual({
        equations: linked_list(eq_c(a, b), eq_c(b, c)),
        freshnesses: linked_list<FreshnessConstraint<Ast>>(fr_c(a, X), fr_c(b, app(a, b))),
        substitution: meta_substitution([X, a], [Y, b]),
        freshness_environment: linked_list([a, W], [b, Z], [c, Y], [b, X])
    }))
    test('the fire nation attacks', () => expect(
        extend_problem(
            {
                equations: linked_list<EquationalConstraint<Ast, Ast>>(eq_c(Z, b), eq_c(b, Z)),
                freshnesses: linked_list<FreshnessConstraint<Ast>>(fr_c(a, X), fr_c(b, Z)),
                substitution: meta_substitution([X, Z], [Y, b]),
                freshness_environment: linked_list([a, W], [b, W], [c, Z])
            },
            {
                equations: linked_list(eq_c(a, b)),
                freshnesses: linked_list(fr_c(a, W)),
                substitution: meta_substitution([Z, c]),
                freshness_environment: linked_list([c, W])
            }
        )
    ).toEqual({
        equations: linked_list<EquationalConstraint<Ast, Ast>>(eq_c(c, b), eq_c(b, c), eq_c(a, b)),
        freshnesses: linked_list<FreshnessConstraint<Ast>>(fr_c(a, X), fr_c(b, c), fr_c(c, c), fr_c(a, W)),
        substitution: meta_substitution([X, c], [Y, b], [Z, c]),
        freshness_environment: linked_list([a, W], [b, W], [c, W])
    }))
})

describe('possibly_extend_problem', () => {
    test('second is an error', () => expect(
        possibly_extend_problem(
            {
                equations: linked_list(),
                freshnesses: linked_list(),
                substitution: meta_substitution(),
                freshness_environment: linked_list()
            },
            no_case_for_equation(eq_c(a, b))
        )
    ).toEqual(
        no_case_for_equation(eq_c(a, b))
    ))
    test('second is not an error', () => expect(
        possibly_extend_problem(
            {
                equations: linked_list<EquationalConstraint<Ast, Ast>>(eq_c(Z, b), eq_c(b, Z)),
                freshnesses: linked_list<FreshnessConstraint<Ast>>(fr_c(a, X), fr_c(b, Z)),
                substitution: meta_substitution([X, Z], [Y, b]),
                freshness_environment: linked_list([a, W], [b, W], [c, Z])
            },
            {
                equations: linked_list(eq_c(a, b)),
                freshnesses: linked_list(fr_c(a, W)),
                substitution: meta_substitution([Z, c]),
                freshness_environment: linked_list([c, W])
            }
        )
    ).toEqual({
        equations: linked_list<EquationalConstraint<Ast, Ast>>(eq_c(c, b), eq_c(b, c), eq_c(a, b)),
        freshnesses: linked_list<FreshnessConstraint<Ast>>(fr_c(a, X), fr_c(b, c), fr_c(c, c), fr_c(a, W)),
        substitution: meta_substitution([X, c], [Y, b], [Z, c]),
        freshness_environment: linked_list([a, W], [b, W], [c, W])
    }))
})

describe('step_atoms_equation', () => {
    test('atoms of different types', () => expect(step_atoms_equation(type_k, a)).toEqual(atoms_are_not_equal(type_k, a)))
    test('atoms of different types 2', () => expect(step_atoms_equation(con('b'), a)).toEqual(atoms_are_not_equal(con('b'), a)))
    test('equal type_ks', () => expect(step_atoms_equation(type_k, type_k)).toEqual(empty_problem))
    test('equal constants', () => expect(step_atoms_equation(con('c'), con('c'))).toEqual(empty_problem))
    test('unequal constants', () => expect(step_atoms_equation(con('b'), con('c'))).toEqual(atoms_are_not_equal(con('b'), con('c'))))
    test('equal variables', () => expect(step_atoms_equation(a, a)).toEqual(empty_problem))
    test('unequal variables', () => expect(step_atoms_equation(c, b)).toEqual(atoms_are_not_equal(c, b)))
})

describe('step_applications_equation', () => {
    test('(a b) =? (b c)', () => expect(
        step_applications_equation(app(a, b), app(b, c))
    ).toEqual({
        equations: linked_list(eq_c(a, b), eq_c(b, c)),
        freshnesses: linked_list(),
        substitution: meta_substitution(),
        freshness_environment: linked_list()
    }))
    test('(a b) =? (a b)', () => expect(
        step_applications_equation(app(a, b), app(a, b))
    ).toEqual({
        equations: linked_list(eq_c(a, a), eq_c(b, b)),
        freshnesses: linked_list(),
        substitution: meta_substitution(),
        freshness_environment: linked_list()
    }))
})

describe('step_abstractions_equation', () => {
    test('lambdas with equal bounds', () => expect(
        step_abstractions_equation(la(b, a, c), la(b, c, a))
    ).toEqual({
        equations: linked_list(eq_c(a, c), eq_c(c, a)),
        freshnesses: linked_list(),
        substitution: meta_substitution(),
        freshness_environment: linked_list()
    }))
    test('lambdas with equal bounds and suspension (make sure (b b) is never added as a permutation!)', () => expect(
        step_abstractions_equation(la(b, a, X), la(b, c, Y))
    ).toEqual({
        equations: linked_list(eq_c(a, c), eq_c(X, Y)),
        freshnesses: linked_list(),
        substitution: meta_substitution(),
        freshness_environment: linked_list()
    }))
    test('lambdas with different bounds', () => expect(
        step_abstractions_equation(la(a, c, b), la(b, a, b))
    ).toEqual({
        // make sure the proper swap is made!
        equations: linked_list(eq_c(c, a), eq_c(b, a)),
        freshnesses: linked_list(fr_c(a, b)),
        substitution: meta_substitution(),
        freshness_environment: linked_list()
    }))
    test('pis with equal bounds', () => expect(
        step_abstractions_equation(pi(b, a, c), pi(b, c, a))
    ).toEqual({
        equations: linked_list(eq_c(a, c), eq_c(c, a)),
        freshnesses: linked_list(),
        substitution: meta_substitution(),
        freshness_environment: linked_list()
    }))
    test('pis with different bounds', () => expect(
        step_abstractions_equation(la(a, c, b), la(b, a, b))
    ).toEqual({
        // make sure the proper swap is made!
        equations: linked_list(eq_c(c, a), eq_c(b, a)),
        freshnesses: linked_list(fr_c(a, b)),
        substitution: meta_substitution(),
        freshness_environment: linked_list()
    }))
    test('lambda and pi that look the same', () => expect(
        step_abstractions_equation(la(a, b, c), pi(a, b, c))
    ).toEqual(
        cannot_unify_different_kinds_of_binders(la(a, b, c), pi(a, b, c))
    ))
    test('pi and lambda that look the same', () => expect(
        step_abstractions_equation(la(a, b, c), pi(a, b, c))
    ).toEqual(
        cannot_unify_different_kinds_of_binders(pi(a, b, c), la(a, b, c))
    ))
})

describe('step_suspensions_with_same_meta_variable_equation', () => {
    test('empty permutations', () => expect(
        step_suspensions_with_same_meta_variable_equation(perm(), perm(), X)
    ).toEqual(empty_problem))
    test('non-empty permutations with empty disagreement set', () => expect(
        step_suspensions_with_same_meta_variable_equation(perm([c, b], [a, b]), perm([b, c], [b, a]), Y)
    ).toEqual(empty_problem))
    test('permutations with a disagreement set of size 2', () => expect(
        // Is it possible to have a disagreement set of odd size?
        step_suspensions_with_same_meta_variable_equation(perm([a, c], [a, b]), perm([b, c]), W)
    ).toEqual({
        equations: linked_list(),
        freshnesses: linked_list(fr_c(a, W), fr_c(c, W)),
        substitution: meta_substitution(),
        freshness_environment: linked_list()
    }))
})

describe('step_left_suspension_equation', () => {
    // a term is relevant to a permutation iff applying the permutation changes the term.
    test('suspension with empty permutation', () => expect(step_left_suspension_equation()(sus(perm(), X), a)).toEqual({
        equations: linked_list(),
        freshnesses: linked_list(),
        substitution: meta_substitution([X, a]),
        freshness_environment: linked_list()
    }))
    test('non-empty permutation in suspension with irrelevant term', () => expect(step_left_suspension_equation()(sus(perm([a, c]), Y), b)).toEqual({
        equations: linked_list(),
        freshnesses: linked_list(),
        substitution: meta_substitution([Y, b]),
        freshness_environment: linked_list()
    }))
    test('non-empty permutation in suspension with relevant term', () => expect(step_left_suspension_equation()(sus(perm([a, c]), W), c)).toEqual({
        equations: linked_list(),
        freshnesses: linked_list(),
        substitution: meta_substitution([W, a]),
        freshness_environment: linked_list()
    }))
    test('non-empty invertible permutation in suspension with relevant term', () => expect(step_left_suspension_equation()(sus(perm([a, c], [a, b]), W), c)).toEqual({
        equations: linked_list(),
        freshnesses: linked_list(),
        substitution: meta_substitution([W, b]),
        freshness_environment: linked_list()
    }))
    test('failed occurs check', () => expect(step_left_suspension_equation()(sus(perm([a, c], [a, b]), W), app(a, W))).toEqual(failed_occurs_check(W, app(a, W))))
    test('failed occurs check but with occurs_check flag set to false so nothing happens', () => expect(step_left_suspension_equation(false)(sus(perm([a, c], [a, b]), W), app(a, W))).toEqual({
        equations: linked_list(),
        freshnesses: linked_list(),
        substitution: meta_substitution([W, app(c, sus(perm([a, b], [a, c]), W))]),
        freshness_environment: linked_list()
    }))
})

describe('step_right_suspension_equation_for_unification', () => {
    test('failed occurs check', () => expect(step_right_suspension_equation_for_unification()(app(a, W), sus(perm([a, c], [a, b]), W))).toEqual(failed_occurs_check(W, app(a, W))))
    test('failed occurs check but with occurs_check flag set to false so nothing happens', () => expect(step_right_suspension_equation_for_unification(false)(app(a, W), sus(perm([a, c], [a, b]), W))).toEqual({
        equations: linked_list(),
        freshnesses: linked_list(),
        substitution: meta_substitution([W, app(c, sus(perm([a, b], [a, c]), W))]),
        freshness_environment: linked_list()
    }))
})

describe('step_right_suspension_equation_for_matching', () => {
    test('example 1', () => expect(step_right_suspension_equation_for_matching(a, sus(perm(), X))).toEqual(suspension_on_right_side_while_matching(a, sus(perm(), X))))
    test('example 2', () => expect(step_right_suspension_equation_for_matching(b, sus(perm([a, b]), W))).toEqual(suspension_on_right_side_while_matching(b, sus(perm([a, b]), W))))
})

describe('step_fresh_in_atom', () => {
    test('fresh in type_k', () => expect(step_fresh_in_atom(a, type_k)).toEqual(empty_problem))
    test('fresh in constant', () => expect(step_fresh_in_atom(b, con('b'))).toEqual(empty_problem))
    test('fresh in different variable', () => expect(step_fresh_in_atom(c, a)).toEqual(empty_problem))
    test('not fresh', () => expect(step_fresh_in_atom(c, c)).toEqual(atom_not_fresh(c)))
})

describe('step_fresh_in_application', () => {
    test('a #? a b', () => expect(step_fresh_in_application(a, app(a, b))).toEqual({
        equations: linked_list(),
        freshnesses: linked_list(fr_c(a, a), fr_c(a, b)),
        substitution: meta_substitution(),
        freshness_environment: linked_list()
    }))
    test('b #? c a', () => expect(step_fresh_in_application(b, app(c, a))).toEqual({
        equations: linked_list(),
        freshnesses: linked_list(fr_c(b, c), fr_c(b, a)),
        substitution: meta_substitution(),
        freshness_environment: linked_list()
    }))
})

describe('step_fresh_in_abstraction', () => {
    test('atom equals bound in lambda', () => expect(step_fresh_in_abstraction(a, la(a, b, c))).toEqual(empty_problem))
    test('atom equals bound in pi', () => expect(step_fresh_in_abstraction(a, pi(a, b, c))).toEqual(empty_problem))
    test('atom does not equal bound in lambda', () => expect(step_fresh_in_abstraction(a, la(b, a, c))).toEqual({
        equations: linked_list(),
        freshnesses: linked_list(fr_c(a, a), fr_c(a, c)),
        substitution: meta_substitution(),
        freshness_environment: linked_list()
    }))
    test('atom does not equal bound in pi', () => expect(step_fresh_in_abstraction(a, pi(b, a, c))).toEqual({
        equations: linked_list(),
        freshnesses: linked_list(fr_c(a, a), fr_c(a, c)),
        substitution: meta_substitution(),
        freshness_environment: linked_list()
    }))
})

describe('step_fresh_in_suspension', () => {
    test('b #? (a c)•X', () => expect(step_fresh_in_suspension(b, sus(perm([a, c]), X))).toEqual({
        equations: linked_list(),
        freshnesses: linked_list(),
        substitution: meta_substitution(),
        freshness_environment: linked_list([b, X])
    }))
    test('a #? (c a)•X', () => expect(step_fresh_in_suspension(a, sus(perm([c, a]), X))).toEqual({
        equations: linked_list(),
        freshnesses: linked_list(),
        substitution: meta_substitution(),
        freshness_environment: linked_list([c, X])
    }))
    test('a #? (a c)(a b)•Y', () => expect(step_fresh_in_suspension(a, sus(perm([a, c], [b, a]), Y))).toEqual({
        equations: linked_list(),
        freshnesses: linked_list(),
        substitution: meta_substitution(),
        freshness_environment: linked_list([c, Y])
    }))
})

describe('next_constraint_from_problem', () => {
    test('next is equation', () => expect(
        next_constraint_from_problem({
            equations: linked_list(eq_c(X, Y), eq_c(a, b), eq_c(c, W)),
            freshnesses: linked_list(fr_c(a, b), fr_c(c, a)),
            substitution: meta_substitution(),
            freshness_environment: linked_list()
        })
    ).toEqual([
        eq_c(X, Y),
        {
            equations: linked_list(eq_c(a, b), eq_c(c, W)),
            freshnesses: linked_list(fr_c(a, b), fr_c(c, a)),
            substitution: meta_substitution(),
            freshness_environment: linked_list()
        }
    ])),
    test('next is freshness', () => expect(
        next_constraint_from_problem({
            equations: linked_list(),
            freshnesses: linked_list(fr_c(a, b), fr_c(c, a)),
            substitution: meta_substitution(),
            freshness_environment: linked_list()
        })
    ).toEqual([
        fr_c(a, b), 
        {
            equations: linked_list(),
            freshnesses: linked_list(fr_c(c, a)),
            substitution: meta_substitution(),
            freshness_environment: linked_list()
        }
    ])),
    test('finished', () => expect(
        next_constraint_from_problem({
            equations: linked_list(),
            freshnesses: linked_list(),
            substitution: meta_substitution(),
            freshness_environment: linked_list()
        })
    ).toEqual([
        undefined,
        {
            equations: linked_list(),
            freshnesses: linked_list(),
            substitution: meta_substitution(),
            freshness_environment: linked_list()
        }
    ]))
})

describe('is_atoms_equation', () => {
    test('both type_ks', () => expect(is_atoms_equation(eq_c(type_k, type_k))).toBeTruthy())
    test('both constants', () => expect(is_atoms_equation(eq_c(con('a'), con('b')))).toBeTruthy())
    test('both variables', () => expect(is_atoms_equation(eq_c(c, a))).toBeTruthy())
    test('type_k, constant', () => expect(is_atoms_equation(eq_c(type_k, a))).toBeTruthy())
    test('constant, type_k', () => expect(is_atoms_equation(eq_c(con('d'), type_k))).toBeTruthy())
    test('type_k, variable', () => expect(is_atoms_equation(eq_c(type_k, c))).toBeTruthy())
    test('variable, type_k', () => expect(is_atoms_equation(eq_c(b, type_k))).toBeTruthy())
    test('variable, constant', () => expect(is_atoms_equation(eq_c(a, con('d')))).toBeTruthy())
    test('constant, variable', () => expect(is_atoms_equation(eq_c(con('f'), b))).toBeTruthy())
    test('left non-atom', () => expect(is_atoms_equation(eq_c(X, a))).toBeFalsy())
    test('right non-atom', () => expect(is_atoms_equation(eq_c(b, Y))).toBeFalsy())
    test('neither atoms', () => expect(is_atoms_equation(eq_c(app(a, b), app(c, X)))).toBeFalsy())
})


describe('is_applications_equation', () => {
    test('both applications', () => expect(is_applications_equation(eq_c(app(a, b), app(c, X)))).toBeTruthy())
    test('left non-application', () => expect(is_applications_equation(eq_c(type_k, app(a, b)))).toBeFalsy())
    test('right non-application', () => expect(is_applications_equation(eq_c(app(c, b), type_k))).toBeFalsy())
    test('both non-applications', () => expect(is_applications_equation(eq_c(type_k, a))).toBeFalsy())
})

describe('is_abstractions_of_same_class_equation', () => {
    test('both lambdas', () => expect(is_abstractions_equation(eq_c(la(a, b, c), la(c, b, a)))).toBeTruthy())
    test('left non-lambda', () => expect(is_abstractions_equation(eq_c(type_k, la(a, b, c)))).toBeFalsy())
    test('right non-lambda', () => expect(is_abstractions_equation(eq_c(la(c, b, a), type_k))).toBeFalsy())
    test('both non-lambda', () => expect(is_abstractions_equation(eq_c(type_k, a))).toBeFalsy())
    test('both pis', () => expect(is_abstractions_equation(eq_c(la(a, b, c), la(c, b, a)))).toBeTruthy())
    test('left non-pi', () => expect(is_abstractions_equation(eq_c(type_k, la(a, b, c)))).toBeFalsy())
    test('right non-pi', () => expect(is_abstractions_equation(eq_c(la(c, b, a), type_k))).toBeFalsy())
    test('both non-pi', () => expect(is_abstractions_equation(eq_c(type_k, a))).toBeFalsy())
    test('lambda, pi', () => expect(is_abstractions_equation(eq_c(la(a, b, c), pi(c, b, a)))).toBeTruthy())
    test('pi, lambda', () => expect(is_abstractions_equation(eq_c(pi(c, a, b), la(b, c, a)))).toBeTruthy())
})

describe('is_suspensions_with_same_meta_variable_equation', () => {
    test('both suspensions with the same meta-variable', () => expect(is_suspensions_with_same_meta_variable_equation(eq_c(sus(perm(), X), sus(perm([a, b]), X)))).toBeTruthy())
    test('both suspensions with different meta-variable', () => expect(is_suspensions_with_same_meta_variable_equation(eq_c(sus(perm(), Y), sus(perm([a, b]), Z)))).toBeFalsy())
    test('both only left suspension', () => expect(is_suspensions_with_same_meta_variable_equation(eq_c(sus(perm(), Z), a))).toBeFalsy())
    test('only right suspension', () => expect(is_suspensions_with_same_meta_variable_equation(eq_c(b, sus(perm(), X)))).toBeFalsy())
    test('neither suspensions', () => expect(is_suspensions_with_same_meta_variable_equation(eq_c(a, b))).toBeFalsy())
})

describe('is_left_suspension_equation', () => {
    test('left is suspension', () => expect(is_left_suspension_equation(eq_c(sus(perm(), X), sus(perm(), Y)))).toBeTruthy())
    test('left is not a suspension, but right is', () => expect(is_left_suspension_equation(eq_c(b, sus(perm(), Y)))).toBeFalsy())
})

describe('is_right_suspension_equation', () => {
    test('right is suspension', () => expect(is_right_suspension_equation(eq_c(sus(perm(), X), sus(perm(), Y)))).toBeTruthy())
    test('right is not a suspension, but left is', () => expect(is_right_suspension_equation(eq_c(sus(perm(), Y), b))).toBeFalsy())
})

describe('is_atom_freshness', () => {
    test('is type_k', () => expect(is_atom_freshness(fr_c(c, type_k))).toBeTruthy())
    test('is constant', () => expect(is_atom_freshness(fr_c(c, con('e')))).toBeTruthy())
    test('is variable', () => expect(is_atom_freshness(fr_c(c, b))).toBeTruthy())
    test('is not an atom', () => expect(is_atom_freshness(fr_c(a, app(a, b)))).toBeFalsy())
})

describe('is_application_freshness', () => {
    test('is application', () => expect(is_application_freshness(fr_c(a, app(a, b)))).toBeTruthy())
    test('is not an application', () => expect(is_application_freshness(fr_c(c, b))).toBeFalsy())
})

describe('is_abstraction_freshness', () => {
    test('is lambda', () => expect(is_abstraction_freshness(fr_c(b, la(a, b, c)))).toBeTruthy())
    test('is pi', () => expect(is_abstraction_freshness(fr_c(c, pi(b, a, c)))).toBeTruthy())
    test('is not an abstraction', () => expect(is_abstraction_freshness(fr_c(a, b))).toBeFalsy())
})

describe('is_suspension_freshness', () => {
    test('is suspension', () => expect(is_suspension_freshness(fr_c(a, sus(perm([a, b], [b, c]), X)))).toBeTruthy())
    test('is not a suspension', () => expect(is_suspension_freshness(fr_c(b, c))).toBeFalsy())
})

describe('nominal_unify', () => {
    test('λ(a: c).λ(b: c).X b =? λ(b: c).λ(a: c).a X', () => expect(
        nominal_unify(la(a, c, la(b, c, app(X, b))), la(b, c, la(a, c, app(a, X))))
    ).toEqual(
        atoms_are_not_equal(b, a)
    ))
    test('λ(a: c).λ(b: c).X b =? λ(b: c).λ(a: c).a Y', () => expect(
        nominal_unify(la(a, c, la(b, c, app(X, b))), la(b, c, la(a, c, app(a, Y))))
    ).toEqual({
        substitution: meta_substitution([X, b], [Y, a]),
        freshness_environment: linked_list()
    }))
    test('λ(a: c).λ(b: c).b X =? λ(b: c).λ(a: c).a Y', () => expect(
        nominal_unify(la(a, c, la(b, c, app(b, X))), la(b, c, la(a, c, app(a, Y))))
    ).toEqual({
        substitution: meta_substitution([X, sus(perm([a, b]), Y)]),
        freshness_environment: linked_list()
    }))
    test('λ(a: c).λ(b: c).b X =? λ(a: c).λ(a: c).a Y', () => expect(
        nominal_unify(la(a, c, la(b, c, app(b, X))), la(a, c, la(a, c, app(a, Y))))
    ).toEqual({
        substitution: meta_substitution([X, sus(perm([b, a]), Y)]),
        freshness_environment: linked_list([b, Y])
    }))
})