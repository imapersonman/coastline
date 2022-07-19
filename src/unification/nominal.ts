import { Application, Ast, Constant, MetaVariable, Suspension, TypeKind, Variable } from "../lambda_pi/ast"
import { contains } from "../lambda_pi/contains"
import { apply_permutation_to_ast, disagreement_set, invert, perm, Permutation } from "../lambda_pi/permutation"
import { app, la, pi, sus } from "../lambda_pi/shorthands"
import { syntactic_equality } from "../lambda_pi/syntactic_equality"
import { Binder, is_application, is_binder, is_constant, is_lambda, is_meta_variable, is_pi, is_suspension, is_type_kind, is_variable } from "../lambda_pi/utilities"
import { concat_linked_lists, find_in_linked_list, is_linked_list, is_non_empty_linked_list, LinkedList, linked_list, linked_list_contains, linked_list_iterator, map_linked_list, non_empty_linked_list, remove_from_linked_list, reverse_linked_list, union_linked_lists } from "../linked_list"
import { match_defined } from "../utilities"

export class EquationalConstraint<A1 extends Ast, A2 extends Ast> { constructor(readonly left: A1, readonly right: A2) {} }
export const eq_c = <A1 extends Ast, A2 extends Ast>(left: A1, right: A2): EquationalConstraint<A1, A2> => new EquationalConstraint(left, right)
export const is_equational_constraint = <A1 extends Ast, A2 extends Ast>(e: unknown): e is EquationalConstraint<A1, A2> => e instanceof EquationalConstraint
export const equations_constraints_equal = (c1: EquationalConstraint<Ast, Ast>, c2: EquationalConstraint<Ast, Ast>): boolean =>
    syntactic_equality(c1.left, c2.left) && syntactic_equality(c1.right, c2.right)

export class FreshnessConstraint<A extends Ast> { constructor(readonly variable: Variable, readonly scope: A) {} }
export const fr_c = <A extends Ast>(variable: Variable, scope: A): FreshnessConstraint<A> => new FreshnessConstraint(variable, scope)
export const is_freshness_constraint = <A extends Ast>(f: unknown): f is FreshnessConstraint<A> => f instanceof FreshnessConstraint
export const freshness_constraints_equal = (c1: FreshnessConstraint<Ast>, c2: FreshnessConstraint<Ast>): boolean =>
    syntactic_equality(c1.variable, c2.variable) && syntactic_equality(c1.scope, c2.scope)

export type NominalConstraint = EquationalConstraint<Ast, Ast> | FreshnessConstraint<Ast>

export type SingleSubstitution = [MetaVariable, Ast]
export type MetaSubstitution = LinkedList<[MetaVariable, Ast]>
export const meta_substitution: (...ss: SingleSubstitution[]) => MetaSubstitution = linked_list

export type FreshnessEnvironment = LinkedList<[Variable, Suspension]>

export interface NominalProblem {
    equations: LinkedList<EquationalConstraint<Ast, Ast>>
    freshnesses: LinkedList<FreshnessConstraint<Ast>>
    substitution: MetaSubstitution
    freshness_environment: FreshnessEnvironment
}

export const is_nominal_problem = (p: any): p is NominalProblem => {
    return ('equations' in p)
        && ('freshnesses' in p)
        && ('substitution' in p)
        && ('freshness_environment' in p)
        && is_linked_list(p.equations)
        && is_linked_list(p.freshnesses)
        && is_linked_list(p.substitution)
        && is_linked_list(p.freshness_environment)
}

export const empty_problem = {
    equations: linked_list(),
    freshnesses: linked_list(),
    substitution: meta_substitution(),
    freshness_environment: linked_list()
}

export interface NominalSolution {
    substitution: MetaSubstitution
    freshness_environment: FreshnessEnvironment
}

class FailedUnification { constructor(readonly equation: EquationalConstraint<Ast, Ast>, readonly reason: NominalError) {} }
const failed_unification = (equation: EquationalConstraint<Ast, Ast>, reason: NominalError): FailedUnification => new FailedUnification(equation, reason)
const is_failed_unification = (f: unknown): f is FailedUnification => f instanceof FailedUnification

export class NoCaseForEquation { constructor(readonly equation: EquationalConstraint<Ast, Ast>) {} }
export const no_case_for_equation = (equation: EquationalConstraint<Ast, Ast>): NoCaseForEquation => new NoCaseForEquation(equation)
export const is_no_case_for_equation = (n: unknown): n is NoCaseForEquation => n instanceof NoCaseForEquation

export class NoCaseForFreshness { constructor(readonly freshness: FreshnessConstraint<Ast>) {} }
export const no_case_for_freshness = (freshness: FreshnessConstraint<Ast>): NoCaseForFreshness => new NoCaseForFreshness(freshness)
export const is_no_case_for_freshness = (f: unknown): f is NoCaseForFreshness => f instanceof NoCaseForFreshness

export class AtomsAreNotEqual { constructor(readonly left: TypeKind | Constant | Variable, readonly right: TypeKind | Constant | Variable) {} }
export const atoms_are_not_equal = (left: TypeKind | Constant | Variable, right: TypeKind | Constant | Variable): AtomsAreNotEqual => new AtomsAreNotEqual(left, right)
export const is_atoms_are_not_equal = (a: unknown): a is AtomsAreNotEqual => a instanceof AtomsAreNotEqual

export class CannotUnifyDifferentKindsOfBinders { constructor(readonly b1: Binder, readonly b2: Binder) {} }
export const cannot_unify_different_kinds_of_binders = (b1: Binder, b2: Binder): CannotUnifyDifferentKindsOfBinders => new CannotUnifyDifferentKindsOfBinders(b1, b2)
export const is_cannot_unify_different_kinds_of_binders = (c: unknown): c is CannotUnifyDifferentKindsOfBinders => c instanceof CannotUnifyDifferentKindsOfBinders

export class FailedOccursCheck { constructor(readonly meta_variable: MetaVariable, readonly occurring_in: Ast) {} }
export const failed_occurs_check = (mv: MetaVariable, oi: Ast): FailedOccursCheck => new FailedOccursCheck(mv, oi)
export const is_failed_occurs_check = (f: unknown): f is FailedOccursCheck => f instanceof FailedOccursCheck

export class SuspensionOnRightSideWhileMatching { constructor(readonly left: Ast, readonly right: Suspension) {} }
export const suspension_on_right_side_while_matching = (left: Ast, right: Suspension): SuspensionOnRightSideWhileMatching => new SuspensionOnRightSideWhileMatching(left, right)
export const is_suspension_on_right_side_while_matching = (s: unknown): s is SuspensionOnRightSideWhileMatching => s instanceof SuspensionOnRightSideWhileMatching

export class AtomNotFresh { constructor(readonly atom: Variable) {} }
export const atom_not_fresh = (atom: Variable): AtomNotFresh => new AtomNotFresh(atom)
export const is_atom_not_fresh = (a: unknown): a is AtomNotFresh => a instanceof AtomNotFresh

export type NominalError =
    | FailedUnification
    | NoCaseForEquation
    | NoCaseForFreshness
    | AtomsAreNotEqual
    | CannotUnifyDifferentKindsOfBinders
    | SuspensionOnRightSideWhileMatching
    | FailedOccursCheck
    | AtomNotFresh

export const is_nominal_error = (e: unknown): e is NominalError =>
    is_failed_unification(e)
    || is_no_case_for_equation(e)
    || is_no_case_for_freshness(e)
    || is_atoms_are_not_equal(e)
    || is_cannot_unify_different_kinds_of_binders(e)
    || is_failed_occurs_check(e)
    || is_suspension_on_right_side_while_matching(e)
    || is_atom_not_fresh(e)

export const compose_meta_substitutions = (s1: MetaSubstitution, s2: MetaSubstitution): MetaSubstitution => {
    const head_mvs_equal = ([mv1]: SingleSubstitution, [mv2]: SingleSubstitution) => syntactic_equality(mv1, mv2)
    if (!is_non_empty_linked_list(s1))
        return s2
    // we're going over the list twice which is lame but not horrible so I'll keep it.
    const s2_contains_head_of_s1 = linked_list_contains(head_mvs_equal)(s2, s1.head)
    return non_empty_linked_list(
        [s1.head[0], apply_meta_substitution_to_ast(s2, s1.head[1])],
        compose_meta_substitutions(
            s1.rest,
            s2_contains_head_of_s1 ? remove_from_linked_list(head_mvs_equal)(s2, s1.head) : s2
        )
    )
}

export const apply_meta_substitution_to_meta_variable = (ms: MetaSubstitution, mv: MetaVariable): Ast =>
    match_defined(
        find_in_linked_list(ms, (e) => syntactic_equality(e[0], mv)),
        ([, ast]) => ast,
        () => mv)

export const apply_meta_substitution_to_ast = (ms: MetaSubstitution, ast: Ast): Ast => {
    if (!is_non_empty_linked_list(ms))
        return ast
    if (is_meta_variable(ast))
        return apply_meta_substitution_to_meta_variable(ms, ast)
    if (is_suspension(ast))
        return apply_permutation_to_ast(ast.permutation, apply_meta_substitution_to_meta_variable(ms, ast.meta_variable))
    if (is_application(ast))
        return app(apply_meta_substitution_to_ast(ms, ast.head), apply_meta_substitution_to_ast(ms, ast.arg))
    if (is_lambda(ast))
        return la(ast.bound, apply_meta_substitution_to_ast(ms, ast.type), apply_meta_substitution_to_ast(ms, ast.scope))
    if (is_pi(ast))
        return la(ast.bound, apply_meta_substitution_to_ast(ms, ast.type), apply_meta_substitution_to_ast(ms, ast.scope))
    return ast
}

export const apply_meta_substitution_to_equational_constraint = (ms: MetaSubstitution, ec: EquationalConstraint<Ast, Ast>): EquationalConstraint<Ast, Ast> =>
    eq_c(apply_meta_substitution_to_ast(ms, ec.left), apply_meta_substitution_to_ast(ms, ec.right))

export const apply_meta_substitution_to_freshness_constraint = (ms: MetaSubstitution, fc: FreshnessConstraint<Ast>): FreshnessConstraint<Ast> =>
    fr_c(fc.variable, apply_meta_substitution_to_ast(ms, fc.scope))

export const apply_meta_substitution_to_constraint = (ms: MetaSubstitution, constraint: NominalConstraint): NominalConstraint =>
    is_equational_constraint(constraint)
    ? apply_meta_substitution_to_equational_constraint(ms, constraint)
    : apply_meta_substitution_to_freshness_constraint(ms, constraint)

export const apply_meta_substitution_to_constraints = <C extends NominalConstraint>(ms: MetaSubstitution, constraints: LinkedList<C>): LinkedList<C> =>
    map_linked_list(constraints, (c) => apply_meta_substitution_to_constraint(ms, c))

export const meta_variable_or_suspension_to_suspension = (mv_or_sus: MetaVariable | Suspension): Suspension =>
    is_meta_variable(mv_or_sus) ? sus(perm(), mv_or_sus) : mv_or_sus

export const apply_meta_substitution_to_freshness_environment = (ms: MetaSubstitution, fe: FreshnessEnvironment): [LinkedList<FreshnessConstraint<Ast>>, FreshnessEnvironment] => {
    let [changed, unchanged] = [linked_list(), linked_list()]
    const it = linked_list_iterator(fe)
    for (const [v, s] of it) {
        const subbed_current = apply_meta_substitution_to_ast(ms, s)
        if (is_meta_variable(subbed_current) || is_suspension(subbed_current))
            unchanged = non_empty_linked_list([v, subbed_current], unchanged)
        else
            changed = non_empty_linked_list(fr_c(v, subbed_current), changed)
    }
    return [reverse_linked_list(changed), reverse_linked_list(unchanged)]
}

export const apply_meta_substitution_to_problem = (ms: MetaSubstitution, p: NominalProblem): NominalProblem => {
    const [new_freshness_constraints, new_freshness_environment] = apply_meta_substitution_to_freshness_environment(ms, p.freshness_environment)
    return {
        equations: apply_meta_substitution_to_constraints(ms, p.equations),
        freshnesses: concat_linked_lists(
            apply_meta_substitution_to_constraints(ms, p.freshnesses),
            new_freshness_constraints),
        substitution: compose_meta_substitutions(p.substitution, ms),
        freshness_environment: new_freshness_environment
    }
}

// It's either use this at the top of the nominal unification algorithm, or change syntactic equality
// to treat MetaVariables and suspensions with empty permutations as syntactically equal, which feels
// dirty.
export const convert_meta_variables_to_suspensions = (ast: Ast): Ast => {
    if (is_meta_variable(ast))
        return sus(perm(), ast)
    if (is_application(ast))
        return app(convert_meta_variables_to_suspensions(ast.head), convert_meta_variables_to_suspensions(ast.arg))
    if (is_lambda(ast))
        return la(ast.bound, convert_meta_variables_to_suspensions(ast.type), convert_meta_variables_to_suspensions(ast.scope))
    if (is_pi(ast))
        return pi(ast.bound, convert_meta_variables_to_suspensions(ast.type), convert_meta_variables_to_suspensions(ast.scope))
    return ast
}

export const extend_problem = (p1: NominalProblem, p2: NominalProblem): NominalProblem => {
    const vs_pairs_equal = (p1: [Variable, Suspension], p2: [Variable, Suspension]): boolean =>
        syntactic_equality(p1[0], p2[0]) && syntactic_equality(p1[1], p2[1])
    const subbed_p1 = apply_meta_substitution_to_problem(p2.substitution, p1)
    return {
        equations: union_linked_lists(equations_constraints_equal)(subbed_p1.equations, p2.equations),
        freshnesses: union_linked_lists(freshness_constraints_equal)(subbed_p1.freshnesses, p2.freshnesses),
        substitution: subbed_p1.substitution,
        freshness_environment: union_linked_lists(vs_pairs_equal)(subbed_p1.freshness_environment, p2.freshness_environment)
    }
}

export const possibly_extend_problem = (p1: NominalProblem, p2: NominalProblem | NominalError): NominalProblem | NominalError => {
    if (is_nominal_error(p2))
        return p2
    return extend_problem(p1, p2)
}

export const step_atoms_equation = (a1: TypeKind | Variable | Constant, a2: TypeKind | Variable | Constant): NominalProblem | NominalError => {
    if (syntactic_equality(a1, a2))
        return empty_problem
    return atoms_are_not_equal(a1, a2)
}

export const step_applications_equation = (a1: Application, a2: Application): NominalProblem => ({
    equations: linked_list(eq_c(a1.head, a2.head), eq_c(a1.arg, a2.arg)),
    freshnesses: linked_list(),
    substitution: meta_substitution(),
    freshness_environment: linked_list()
})

export const step_abstractions_equation = (a1: Binder, a2: Binder): NominalProblem | NominalError => {
    if ((is_lambda(a1) && is_pi(a2)) || (is_pi(a1) && is_lambda(a2)))
        return cannot_unify_different_kinds_of_binders(a1, a2)
    const [mod_freshnesses, modified_a2_scope] =
        syntactic_equality(a1.bound, a2.bound)
        ? [linked_list(), a2.scope]
        : [linked_list(fr_c(a1.bound, a2.scope)), apply_permutation_to_ast(perm([a1.bound, a2.bound]), a2.scope)]
    return {
        equations: linked_list(eq_c(a1.type, a2.type), eq_c(a1.scope, modified_a2_scope)),
        freshnesses: mod_freshnesses,
        substitution: meta_substitution(),
        freshness_environment: linked_list()
    }
}

export const step_suspensions_with_same_meta_variable_equation = (p1: Permutation, p2: Permutation, mv: MetaVariable): NominalProblem => ({
    equations: linked_list(),
    freshnesses: map_linked_list(disagreement_set(p1, p2), (a) => fr_c(a, mv)),
    substitution: meta_substitution(),
    freshness_environment: linked_list()
})

export const step_left_suspension_equation = (occurs_check: boolean = true) => (suspension: Suspension, ast: Ast): NominalProblem | NominalError => {
    if (occurs_check && contains(ast, suspension.meta_variable))
        return failed_occurs_check(suspension.meta_variable, ast)
    return {
        equations: linked_list(),
        freshnesses: linked_list(),
        substitution: meta_substitution([suspension.meta_variable, apply_permutation_to_ast(invert(suspension.permutation), ast)]),
        freshness_environment: linked_list()
    }
}

export const step_right_suspension_equation_for_unification = (occurs_check: boolean = true) => (ast: Ast, suspension: Suspension): NominalProblem | NominalError =>
    // default implementation of this function just returns step_left_suspension_equation with occurs_check = true.
    step_left_suspension_equation(occurs_check)(suspension, ast)

export const step_right_suspension_equation_for_matching = (ast: Ast, suspension: Suspension): NominalProblem | NominalError =>
    suspension_on_right_side_while_matching(ast, suspension)

export const step_fresh_in_atom = (a1: Variable, a2: TypeKind | Variable | Constant): NominalProblem | NominalError => {
    if (syntactic_equality(a1, a2))
        return atom_not_fresh(a1)
    return empty_problem
}

export const step_fresh_in_application = (a1: Variable, a2: Application): NominalProblem => ({
    equations: linked_list(),
    freshnesses: linked_list(fr_c(a1, a2.head), fr_c(a1, a2.arg)),
    substitution: meta_substitution(),
    freshness_environment: linked_list()
})

export const step_fresh_in_abstraction = (a1: Variable, a2: Binder): NominalProblem | NominalError => {
    if (syntactic_equality(a1, a2.bound))
        return empty_problem
    return {
        equations: linked_list(),
        freshnesses: linked_list(fr_c(a1, a2.type), fr_c(a1, a2.scope)),
        substitution: meta_substitution(),
        freshness_environment: linked_list()
    }
}

export const step_fresh_in_suspension = (a1: Variable, suspension: Suspension): NominalProblem => ({
    equations: linked_list(),
    freshnesses: linked_list(),
    substitution: meta_substitution(),
    freshness_environment: linked_list([apply_permutation_to_ast(invert(suspension.permutation), a1), suspension.meta_variable])
})

export const next_constraint_from_problem = (problem: NominalProblem): [NominalConstraint | undefined, NominalProblem] => {
    if (is_non_empty_linked_list(problem.equations))
        return [problem.equations.head, { ...problem, equations: problem.equations.rest }]
    if (is_non_empty_linked_list(problem.freshnesses))
        return [problem.freshnesses.head, { ...problem, freshnesses: problem.freshnesses.rest }]
    return [undefined, problem]
}

export const is_atoms_equation = (equation: EquationalConstraint<Ast, Ast>): equation is EquationalConstraint<TypeKind | Constant | Variable, TypeKind | Constant | Variable> =>
    (is_type_kind(equation.left) || is_constant(equation.left) || is_variable(equation.left))
    && (is_type_kind(equation.right) || is_constant(equation.right) || is_variable(equation.right))

export const is_atom_freshness = (freshness: FreshnessConstraint<Ast>): freshness is FreshnessConstraint<TypeKind | Constant | Variable> =>
    is_type_kind(freshness.scope) || is_constant(freshness.scope) || is_variable(freshness.scope)

export const is_application_freshness = (freshness: FreshnessConstraint<Ast>): freshness is FreshnessConstraint<Application> =>
    is_application(freshness.scope)

export const is_abstraction_freshness = (freshness: FreshnessConstraint<Ast>): freshness is FreshnessConstraint<Binder> =>
    is_binder(freshness.scope)

export const is_suspension_freshness = (freshness: FreshnessConstraint<Ast>): freshness is FreshnessConstraint<Suspension> =>
    is_suspension(freshness.scope)

export const step_phase_two = (freshness: FreshnessConstraint<Ast>): NominalProblem | NominalError => {
    if (is_application_freshness(freshness))
        return step_fresh_in_application(freshness.variable, freshness.scope)
    if (is_abstraction_freshness(freshness))
        return step_fresh_in_abstraction(freshness.variable, freshness.scope)
    if (is_suspension_freshness(freshness))
        return step_fresh_in_suspension(freshness.variable, freshness.scope)
    if (is_atom_freshness(freshness))
        return step_fresh_in_atom(freshness.variable, freshness.scope)
    return no_case_for_freshness(freshness)
}

export const is_applications_equation = (equation: EquationalConstraint<Ast, Ast>): equation is EquationalConstraint<Application, Application> =>
    is_application(equation.left) && is_application(equation.right)

export const is_abstractions_equation = (equation: EquationalConstraint<Ast, Ast>): equation is EquationalConstraint<Binder, Binder> =>
    is_binder(equation.left) && is_binder(equation.right)

export const is_suspensions_with_same_meta_variable_equation = (equation: EquationalConstraint<Ast, Ast>): equation is EquationalConstraint<Suspension, Suspension> =>
    is_suspension(equation.left) && is_suspension(equation.right) && syntactic_equality(equation.left.meta_variable, equation.right.meta_variable)

export const is_left_suspension_equation = (equation: EquationalConstraint<Ast, Ast>): equation is EquationalConstraint<Suspension, Ast> =>
    is_suspension(equation.left)

export const is_right_suspension_equation = (equation: EquationalConstraint<Ast, Ast>): equation is EquationalConstraint<Ast, Suspension> =>
    is_suspension(equation.right)

export const make_phase_one_step = (
    step_left_suspension_equation: (s: Suspension, t: Ast) => NominalProblem | NominalError,
    step_right_suspension_equation: (t: Ast, s: Suspension) => NominalProblem | NominalError
) => (equation: EquationalConstraint<Ast, Ast>): NominalProblem | NominalError => {
    if (is_applications_equation(equation))
        return step_applications_equation(equation.left, equation.right)
    if (is_abstractions_equation(equation))
        return step_abstractions_equation(equation.left, equation.right)
    if (is_suspensions_with_same_meta_variable_equation(equation))
        return step_suspensions_with_same_meta_variable_equation(equation.left.permutation, equation.right.permutation, equation.left.meta_variable)
    if (is_left_suspension_equation(equation))
        return step_left_suspension_equation(equation.left, equation.right)
    if (is_right_suspension_equation(equation))
        return step_right_suspension_equation(equation.left, equation.right)
    if (is_atoms_equation(equation))
        return step_atoms_equation(equation.left, equation.right)
    return no_case_for_equation(equation)
}

export const step_problem = (
    step_left_suspension_equation: (s: Suspension, t: Ast) => NominalProblem | NominalError,
    step_right_suspension_equation: (t: Ast, s: Suspension) => NominalProblem | NominalError
) => (problem: NominalProblem): NominalProblem | NominalSolution | NominalError => {
    const [constraint, rest_of_problem] = next_constraint_from_problem(problem)
    const sp1 = make_phase_one_step(step_left_suspension_equation, step_right_suspension_equation)
    if (is_equational_constraint(constraint))
        return possibly_extend_problem(rest_of_problem, sp1(constraint))
    if (is_freshness_constraint(constraint))
        return possibly_extend_problem(rest_of_problem, step_phase_two(constraint))
    return {
        substitution: problem.substitution,
        freshness_environment: problem.freshness_environment
    }
}

export const solve_problem = (
    step_left_suspension_equation: (s: Suspension, t: Ast) => NominalProblem | NominalError,
    step_right_suspension_equation: (t: Ast, s: Suspension) => NominalProblem | NominalError
) => (problem: NominalProblem): NominalSolution | NominalError => {
    const step = step_problem(step_left_suspension_equation, step_right_suspension_equation)
    let current: NominalProblem | NominalSolution | NominalError = problem
    while (is_nominal_problem(current))
        current = step(current)
    return current
}

export const start_problem_with_equation = (equation: EquationalConstraint<Ast, Ast>): NominalProblem => ({
    equations: linked_list(equation),
    freshnesses: linked_list(),
    substitution: meta_substitution(),
    freshness_environment: linked_list()
})

export const nominal_unify = (left: Ast, right: Ast): NominalSolution | NominalError =>
    solve_problem(
        step_left_suspension_equation(true),
        step_right_suspension_equation_for_unification(true)
    )(start_problem_with_equation(eq_c(
        convert_meta_variables_to_suspensions(left),
        convert_meta_variables_to_suspensions(right))))

export const nominal_match = (pattern: Ast, subject: Ast): NominalSolution | NominalError =>
    solve_problem(
        step_left_suspension_equation(false),
        step_right_suspension_equation_for_matching
    )(start_problem_with_equation(eq_c(
        convert_meta_variables_to_suspensions(pattern),
        convert_meta_variables_to_suspensions(subject))))