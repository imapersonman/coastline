import { isEqual, unionWith } from "lodash"
import { declare, defined, first, is_string, rest, zip } from "../utilities"
import { CoastlineControl } from "./control"
import { err, ErrorValueMap } from "./error"
import { AnyCoastlineObject, CoastlineObject, cta, ctas, ecc_term_types, obj, ObjectValueMap, object_constructor, Substitution } from "./object"
import { OperatorDefinition, operator_app, operator_definition } from "./operator"
import { OptionsTree, options_tree } from "./options_tree"
import { req2 } from "./request"
import { expect_type, expect_types } from "./utilities"

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////// FIBONACCI /////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export type NatOVM = {
    Natural_Number: number
    EmptyBinTree: { num: CoastlineObject<NatOVM, 'Natural_Number'> }
    NonEmptyBinTree: { num: CoastlineObject<NatOVM, 'Natural_Number'>, left: CoastlineObject<NatOVM, BinaryTree>, right: CoastlineObject<NatOVM, BinaryTree> }
    NaturalList: CoastlineObject<NatOVM, 'Natural_Number'>[]
}

export type NatEVM = {
    'InputNotEqualTo': number
    'InputNotGreaterThanOrEqualTo': number
    'WithMessage': string
}

const expect_natural = expect_type<NatOVM, NatEVM, 'Natural_Number'>('Natural_Number')
const nat = object_constructor('Natural_Number')

export const fib_def = operator_definition<NatOVM, NatEVM>('fib', ['n'], (inputs) =>
    expect_natural(inputs[0], (n) =>
        options_tree([
            ['zero'  , () => n.value !== 0 ? err('InputNotEqualTo', 0) : obj('Natural_Number', 0)],
            ['one'   , () => n.value !== 1
                ? err('InputNotEqualTo', 1)
                : obj('Natural_Number', 1)],
            // ['cool'  , () => n.value !== 1 ? err('InputNotEqualTo', 1) : obj('Natural_Number', 1)],
            ['ge_two', () => n.value   < 2 ? err('InputNotGreaterThanOrEqualTo', 2)
                : operator_app(plus_def, [
                    operator_app(fib_def, [obj('Natural_Number', n.value - 2)]),
                    operator_app(fib_def, [obj('Natural_Number', n.value - 1)])
                ])
            ]
        ])
    )
)

export const plus_def = operator_definition<NatOVM, NatEVM>('plus', ['n1', 'n2'], (inputs) =>
    expect_natural(inputs[0], (n1) =>
        expect_natural(inputs[1], (n2) =>
            obj('Natural_Number', n1.value + n2.value)
        )
    )
)

export const max_def = operator_definition<NatOVM, NatEVM>('max', ['n1', 'n2'], (inputs) => expect_natural(inputs[0], (n1) => expect_natural(inputs[1], (n2) => n1.value >= n2.value ? n1 : n2)))

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////// TERMS_EQUAL ////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export type Term = 'TermAtom' | 'TermVariable' | 'TermList'

export interface TermOVM extends ObjectValueMap {
    'TermAtom': string
    'TermVariable': string
    'TermList': CoastlineObject<TermOVM, Term>[]
    'Boolean': boolean
    'EmptySub': []
    'NonEmptySub': {
        variable: CoastlineObject<TermOVM, 'TermVariable'>,
        term: CoastlineObject<TermOVM, 'TermAtom' | 'TermVariable' | 'TermList'>,
        rest: CoastlineObject<TermOVM, 'EmptySub' | 'NonEmptySub'>
    }
    'UnificationEquation': { left: CoastlineObject<TermOVM, Term>, right: CoastlineObject<TermOVM, Term> }
    'UnificationProblem': CoastlineObject<TermOVM, 'UnificationEquation'>[]
}

export type TermEVM = {
    'TermsAreNotEqual': { term1: CoastlineObject<TermOVM, Term>, term2: CoastlineObject<TermOVM, Term> },
    'TermsAreEqual': { term1: CoastlineObject<TermOVM, Term>, term2: CoastlineObject<TermOVM, Term> }
    'OneListIsNotEmpty': { list1: CoastlineObject<TermOVM, 'TermList'>, list2: CoastlineObject<TermOVM, 'TermList'> }
    'OneListIsEmpty': { list1: CoastlineObject<TermOVM, 'TermList'>, list2: CoastlineObject<TermOVM, 'TermList'> }
    'SubstitutionVariablesAppearInTerm': undefined
    'ListIsNotEmpty': CoastlineObject<TermOVM, 'TermList'>
    'ListIsEmpty': CoastlineObject<TermOVM, 'TermList'>
    'WithMessage': string
    'CannotSwapError': undefined
    'VariableOccursInTerm': { variable: CoastlineObject<TermOVM, 'TermVariable'>, term: CoastlineObject<TermOVM, Term> }
    'VariableDoesNotOccurInTerm': { variable: CoastlineObject<TermOVM, 'TermVariable'>, term: CoastlineObject<TermOVM, Term> }
    'ListsHaveDifferentLengths': { list1: CoastlineObject<TermOVM, 'TermList'>, list2: CoastlineObject<TermOVM, 'TermList'> }
    'UnificationProblemIsNotEmpty': undefined
    'UnificationProblemIsEmpty': undefined
}

const expect_term     = expect_types<TermOVM, TermEVM, Term>('TermAtom', 'TermVariable', 'TermList')
const expect_atom     = expect_type<TermOVM, TermEVM, 'TermAtom'>('TermAtom')
const expect_variable = expect_type<TermOVM, TermEVM, 'TermVariable'>('TermVariable')
const expect_boolean  = expect_type<TermOVM, TermEVM, 'Boolean'>('Boolean')
const expect_list     = expect_type<TermOVM, TermEVM, 'TermList'>('TermList')

// (Term, Term) => Boolean
export const terms_equal_def = operator_definition<TermOVM, TermEVM>('terms_equal', ['left', 'right'], (inputs) =>
    expect_term(inputs[0], (t1) => expect_term(inputs[1], (t2) =>
        options_tree<TermOVM, TermEVM>([
            ['atoms',           () => operator_app(atoms_equal_def,     [t1, t2])],
            ['variables',       () => operator_app(variables_equal_def, [t1, t2])],
            ['lists',           () => operator_app(lists_equal_def,     [t1, t2])],
            ['different_types', () => obj('Boolean', false)]
        ])
    ))
)

// (TermAtom, TermAtom) => Boolean
export const atoms_equal_def = operator_definition<TermOVM, TermEVM>('atoms_equal', ['left', 'right'], (inputs) =>
    expect_atom(inputs[0], (a1) => expect_atom(inputs[1], (a2) =>
        options_tree([
            ['atoms_are_equal',     () => a1.value !== a2.value ? err('TermsAreNotEqual', { term1: a1, term2: a2 }) : obj('Boolean', true)],
            ['atoms_are_not_equal', () => a1.value === a2.value ? err('TermsAreEqual',    { term1: a1, term2: a2 }) : obj('Boolean', false)]
        ])
    ))
)

// (TermVariable, TermVariable) => Boolean
export const variables_equal_def = operator_definition<TermOVM, TermEVM>('variables_equal', ['left', 'right'], (inputs) =>
    expect_variable(inputs[0], (v1) => expect_variable(inputs[1], (v2) =>
        options_tree([
            ['atoms_are_equal',     () => v1.value !== v2.value ? err('TermsAreNotEqual',  { term1: v1, term2: v2 }) : obj('Boolean', true)],
            ['atoms_are_not_equal', () => v1.value === v2.value ? err('TermsAreEqual',     { term1: v1, term2: v2 }) : obj('Boolean', false)]
        ])
    ))
)

// (Boolean, Boolean) => Boolean
export const and_def = operator_definition('and', ['b1', 'b2'], (inputs: AnyCoastlineObject<TermOVM>[]) =>
    expect_boolean(inputs[0], (b1) => expect_boolean(inputs[1], (b2) =>
        obj('Boolean', b1.value && b2.value)
    ))
)

// (TermList, TermList) => Boolean
export const lists_equal_def = operator_definition<TermOVM, TermEVM>('lists_equal', ['left', 'right'], (inputs: AnyCoastlineObject<TermOVM>[]) =>
    expect_list(inputs[0], (l1) => expect_list(inputs[1], (l2) =>
        options_tree([
            ['lists_are_empty',     () => l1.value.length !== 0 || l2.value.length !== 0 ? err('OneListIsNotEmpty', { list1: l1, list2: l2 }) : obj('Boolean', true)],
            ['lists_are_not_empty', () => l1.value.length === 0 || l2.value.length === 0 ? err('OneListIsEmpty',    { list1: l1, list2: l2 })
                : operator_app(and_def, [
                    operator_app(terms_equal_def, [first(l1.value),      first(l2.value)]),
                    operator_app(lists_equal_def, [obj('TermList', rest(l1.value)), obj('TermList', rest(l2.value))])
                ])
            ]
        ])
    ))
)

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////// SUBSTITUTIONS ////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export type Subst = 'EmptySub' | 'NonEmptySub'
export const subst_types = ['EmptySub', 'NonEmptySub']

const expect_sub           = expect_types<TermOVM, TermEVM, Subst>('EmptySub', 'NonEmptySub')
const expect_empty_sub     = expect_type<TermOVM, TermEVM, 'EmptySub'>('EmptySub')
const expect_non_empty_sub = expect_type<TermOVM, TermEVM, 'NonEmptySub'>('NonEmptySub')

export const substitution_variables_appear_in_term = (s: CoastlineObject<TermOVM, Subst>, t: CoastlineObject<TermOVM, Term>): boolean => {
    if (cta('EmptySub', s))
        return false
    if (cta('NonEmptySub', s))
        return js_occurs_check(s.value.variable, t) || substitution_variables_appear_in_term(s.value.rest, t)
    return false
}

// (Substitution, Term) => Term
export const apply_substitution_def_2 = operator_definition<TermOVM, TermEVM>('apply_substitution', ['substitution', 'term'], (inputs) =>
    expect_sub(inputs[0], (s) => expect_term(inputs[1], (t) =>
        options_tree([
            ['substitution_variables_do_not_appear_in_term', () => substitution_variables_appear_in_term(s, t) ? err('SubstitutionVariablesAppearInTerm', undefined) : t],
            ['atom', () => expect_atom(t, () => t)],
            ['variable', () => expect_variable(t, () => operator_app(apply_substitution_to_variable_def, [s, t]))],
            ['list', () => expect_list(t, () => operator_app(apply_substitution_to_list_def_2, [s, t]))]
        ])
    ))
)

// (Substitution, Variable) => Term
export const apply_substitution_to_variable_def = operator_definition<TermOVM, TermEVM>('apply_substitution_to_variable', ['substitution', 'variable'], (inputs) =>
    expect_sub(inputs[0], (s) => expect_variable(inputs[1], (v) =>
        options_tree([
            ['empty_sub', () => expect_empty_sub(s, () => v)],
            ['first_substitution_equals_variable', () => expect_non_empty_sub(s, (nes) =>
                nes.value.variable.value !== v.value
                    ? err('TermsAreNotEqual', { term1: nes.value.variable, term2: v })
                    : nes.value.term
            )],
            ['first_substitution_does_not_equal_variable', () => expect_non_empty_sub(s, (nes) =>
                nes.value.variable.value === v.value
                    ? err('TermsAreEqual', { term1: nes.value.variable, term2: v })
                    : operator_app(apply_substitution_to_variable_def, [nes.value.rest, v])
            )]
        ])
    ))
)

// (Substitution, TermList) => TermList
export const apply_substitution_to_list_def_2 = operator_definition<TermOVM, TermEVM>('apply_substitution_to_list_def_2', ['substitution', 'list'], (inputs) =>
    expect_sub(inputs[0], (s) => expect_list(inputs[1], (l) =>
        options_tree([
            ['empty', () => l.value.length !== 0 ? err('ListIsNotEmpty', l) : l],
            ['non_empty', () => l.value.length === 0 ? err('ListIsEmpty', l)
                : operator_app(cons_def, [
                    operator_app(apply_substitution_def_2, [s, first(l.value)]),
                    operator_app(apply_substitution_to_list_def_2, [s, obj('TermList', rest(l.value))])
                ])]
        ])
    ))
)

// (Term, TermList) => TermList
export const cons_def = operator_definition<TermOVM, TermEVM>('cons', ['head', 'tail'], (inputs) =>
    expect_term(inputs[0], (t) => expect_list(inputs[1], (l) =>
        obj('TermList', [t, ...l.value])
    ))
)

// (s1 o s2)(f) = s1(s2(f)),
// so we should append s1 to the end of s2, applying s1 to every term in s2.
// if there are conflicting variables, the one seen in 
export const compose_substitutions_def = operator_definition<TermOVM, TermEVM>('compose_substitutions', ['s1', 's2'], (inputs) =>
    expect_sub(inputs[0], (s1) => expect_sub(inputs[1], (s2) =>
        options_tree([
            ['second_sub_is_empty',     () => expect_empty_sub    (s2, ()     => s1)],
            ['second_sub_is_non_empty', () => expect_non_empty_sub(s2, (nes2) =>
                operator_app(cons_sub_def, [
                    nes2.value.variable,
                    operator_app(apply_substitution_def_2, [
                        s1,
                        nes2.value.term
                    ]),
                    operator_app(compose_substitutions_def, [
                        s1,
                        nes2.value.rest
                    ])
                ])
            )]
        ])
    ))
)

// (Variable, Term, Substitution) => Substitution
// the given Variable and Term form the head of the resulting Substitution,
// meaning the Variable and Term will be applied first when applied to another
// term.  No further substitutions are made down the tree, as this method
// will mainly be used to rebuild substitutions after recursive calls.
// (Variable, Term, Substitution) => NonEmptySub
export const cons_sub_def = operator_definition<TermOVM, TermEVM>('cons_substitution', ['new_variable', 'new_term', 'old_substitution'], (inputs) =>
    expect_variable(inputs[0], (v) => expect_term(inputs[1], (t) => expect_sub(inputs[2], (s) =>
        obj('NonEmptySub', { variable: v, term: t, rest: s })
    )))
)

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////// BUILDING TERMS //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const expect_string = expect_type('String')

// export const as_term_def = operator_definition('as_term', (inputs) =>
//     expect_types('TermAtom', 'TermVariable', 'TermList')(inputs[0], (t) => t)
// )

export const build_term_def = operator_definition('build_term', [], () =>
    options_tree([
        ['atom',     () => operator_app(build_atom_def, [req2('String')])],
        ['variable', () => operator_app(build_variable_def, [req2('String')])],
        ['list',     () => operator_app(build_list_def, [])]
    ])
)

// (String) => TermAtom
export const build_atom_def = operator_definition('build_atom', ['name'], (inputs) =>
    expect_string(inputs[0], (name) => obj('TermAtom', name.value))
)

// () => TermVariable
export const build_variable_def = operator_definition('build_variable', ['id'], (inputs) =>
    expect_string(inputs[0], (id) => obj('TermVariable', id.value))
)

export const build_list_def = operator_definition<TermOVM, TermEVM>('build_list', [], () =>
    options_tree([
        ['empty',     () => obj('TermList', [])],
        ['non_empty', () => operator_app(cons_def, [
            operator_app(build_term_def, []),
            operator_app(build_list_def, [])
        ])]
    ])
)

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////// UNIFICATION ///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const expect_unification_problem = expect_type<TermOVM, TermEVM, 'UnificationProblem'>('UnificationProblem')
const expect_unification_equation = expect_type<TermOVM, TermEVM, 'UnificationEquation'>('UnificationEquation')

// (Term, Term) => Substitution
export const start_unification_def = operator_definition<TermOVM, TermEVM>('start_unification', ['left', 'right'], (inputs) =>
    expect_term(inputs[0], (left) => expect_term(inputs[1], (right) =>
        operator_app(unify_def, [obj('EmptySub', []), obj('UnificationProblem', [obj<TermOVM, 'UnificationEquation'>('UnificationEquation', ({ left, right }))])])
    ))
)

const js_terms_equal = (l: CoastlineObject<TermOVM, Term>, r: CoastlineObject<TermOVM, Term>): boolean => {
    if (cta('TermList', l) && cta('TermList', r))
        return l.value.length === r.value.length && zip(l.value, r.value).every(([lt, rt]) => js_terms_equal(lt, rt))
    return l.type === r.type && l.value === r.value
}

const js_occurs_check = (lv: CoastlineObject<TermOVM, 'TermVariable'>, r: CoastlineObject<TermOVM, Term>): boolean => {
    return (cta('TermVariable', r) && lv.value === r.value)
        || (cta('TermList', r) && r.value.some((t) => js_occurs_check(lv, t)))
}

const js_conflicts = (l: CoastlineObject<TermOVM, Term>, r: CoastlineObject<TermOVM, Term>): boolean =>
    (cta('TermAtom', l) && cta('TermAtom', r) && l.value !== r.value)
    || (cta('TermList', l) && cta('TermList', r) && l.value.length !== r.value.length)

// (Substitution, UnificationProblem, UnificationEquation) => Substitution | UnificationError
export const unify_def = operator_definition<TermOVM, TermEVM>('unify', ['substitution', 'problem'], (inputs) =>
    expect_sub(inputs[0], (sub) => expect_unification_problem(inputs[1], (problem) =>
        problem.value.length === 0 ? sub
        : declare(first(problem.value), ({ value: { left: l, right: r } }) => options_tree([
            ['delete', () => !js_terms_equal(l, r) ? err('TermsAreNotEqual', { term1: l, term2: r }) : operator_app(unify_def, [sub, obj('UnificationProblem', rest(problem.value))])],
            ['decompose', () => expect_list(l, (ll) => expect_list(r, (rl) => skipped_decompose(sub, obj('UnificationProblem', rest(problem.value)), ll, rl)))],
            ['conflict', () => !js_conflicts(l, r) ? err('WithMessage', 'Terms do not conflict!') : obj('UnificationError', undefined)],
            ['swap', () => !cta('TermVariable', l) && !cta('TermVariable', r) ? err('CannotSwapError', undefined) : operator_app(unify_def, [sub, obj('UnificationProblem', [obj<TermOVM, 'UnificationEquation'>('UnificationEquation', { left: r, right: l }), ...rest(problem.value)])])],
            ['eliminate', () => expect_variable(l, (lv) => js_occurs_check(lv, r) ? err('VariableOccursInTerm', { variable: lv, term: r }) : skipped_eliminate(sub, obj('UnificationProblem', rest(problem.value)), lv, r))],
            ['check', () => expect_variable(l, (lv) =>
                !js_occurs_check(lv, r)
                    ? err('VariableDoesNotOccurInTerm', { variable: lv, term: r })
                    : js_terms_equal(l, r) ? err('WithMessage', 'Occurs check cannot be run when two terms are equal!')
                    : obj('UnificationError', undefined))]
        ]))
    ))
)

const skipping_check_unify_finished = (sub: CoastlineObject<TermOVM, Substitution>, problem: CoastlineObject<TermOVM, 'UnificationProblem'>): CoastlineControl<TermOVM, TermEVM> => {
    if (problem.value.length === 0)
        return sub
    return operator_app(unify_def, [sub, obj('UnificationProblem', rest(problem.value)), obj('UnificationEquation', ({ left: first(problem.value).value.left, right: first(problem.value).value.right }))])
}

// (Substitution, UnificationProblem) => Substitution
export const check_unify_finished_def = operator_definition<TermOVM, TermEVM>('check_unify_finished', ['substitution', 'problem'], (inputs) =>
    expect_sub(inputs[0], (sub) => expect_unification_problem(inputs[1], (ues) =>
        ues.value.length === 0 ? sub
        : operator_app(unify_def, [
            sub,
            obj('UnificationProblem', rest(ues.value)),
            obj('UnificationEquation', ({ left: first(ues.value).value.left, right: first(ues.value).value.right }))
        ])
    ))
)

const skipped_decompose = (sub: CoastlineObject<TermOVM, Substitution>, problem: CoastlineObject<TermOVM, 'UnificationProblem'>, l: CoastlineObject<TermOVM, 'TermList'>, r: CoastlineObject<TermOVM, 'TermList'>): CoastlineControl<TermOVM, TermEVM> => {
    if (l.value.length !== r.value.length)
        return err('ListsHaveDifferentLengths', { list1: l, list2: r })
    const new_ues_array = zip(l.value, r.value).map(([lt, rt]) => (obj('UnificationEquation', { left: lt, right: rt })))
    const mod_ues = obj('UnificationProblem', [...new_ues_array, ...problem.value])
    return operator_app<TermOVM, TermEVM>(unify_def, [sub, mod_ues])
}

// // (Substitution, UnificationProblem, TermList, TermList) => Substitution
// export const decompose_def = operator_definition('decompose', ['substitution', 'problem', 'left', 'right'], (inputs) =>
//     expect_sub(inputs[0], (sub) => expect_unification_problem(inputs[1], (ues) => expect_list(inputs[2], (l) => expect_list(inputs[3], (r) => {
//         if (l.value.length !== r.value.length)
//             return err('ListsHaveDifferentLengths', { list1: l, list2: r })
//         const new_ues_array = zip(l.value, r.value).map(([lt, rt]) => (obj('UnificationEquation', { left: lt, right: rt })))
//         const mod_ues = obj('UnificationProblem', [...new_ues_array, ...ues.value])
//         return skipping_check_unify_finished(sub, mod_ues)
//     }))))
// )

const skipped_eliminate = (sub: CoastlineObject<TermOVM, Substitution>, problem: CoastlineObject<TermOVM, 'UnificationProblem'>, variable: CoastlineObject<TermOVM, 'TermVariable'>, term: CoastlineObject<TermOVM, Term>): CoastlineControl<TermOVM, TermEVM> =>
    operator_app(substitute_in_unification_problem_then_continue_unifying_def, [
        operator_app(add_to_substitution_def, [sub, variable, term]),
        problem
    ])


// (Substitution, UnificationProblem, Variable, Term) => Substitution
export const eliminate_def = operator_definition<TermOVM, TermEVM>('eliminate', ['substitution', 'problem', 'variable', 'term'], (inputs) =>
    expect_sub(inputs[0], (sub) => expect_unification_problem(inputs[1], (ues) => expect_variable(inputs[2], (v) => expect_term(inputs[3], (t) =>
        // This function's necessity is a good argument for adding declaration blocks as a kind of control.
        operator_app(substitute_in_unification_problem_then_continue_unifying_def, [
            operator_app(add_to_substitution_def, [sub, v, t]),
            ues
        ])
    ))))
)

// (Substitution, UnificationProblem) => Substitution
export const substitute_in_unification_problem_then_continue_unifying_def = operator_definition<TermOVM, TermEVM>('substitute_in_unification_problem_then_continue_unifying', ['substitution', 'problem'], (inputs) =>
    expect_sub(inputs[0], (sub) => expect_unification_problem(inputs[1], (ues) =>
        operator_app(unify_def, [
            sub,
            operator_app(substitute_in_unification_problem_def, [sub, ues])
        ])
    ))
)

// (Substitution, UnificationProblem) => UnificationProblem
export const substitute_in_unification_problem_def = operator_definition<TermOVM, TermEVM>('substitute_in_unification_problem', ['substitution', 'problem'], (inputs) =>
    expect_sub(inputs[0], (sub) => expect_unification_problem(inputs[1], (ues) =>
        options_tree([
            ['unification_problem_is_empty', () => ues.value.length !== 0 ? err('UnificationProblemIsNotEmpty', undefined) : ues],
            ['unification_problem_is_not_empty', () => ues.value.length === 0 ? err('UnificationProblemIsEmpty', undefined)
                : operator_app(cons_unification_problem_def, [
                    operator_app(make_unification_equation_def, [
                        operator_app(apply_substitution_def_2, [sub, first(ues.value).value.left]),
                        operator_app(apply_substitution_def_2, [sub, first(ues.value).value.right])
                    ]),
                    operator_app(substitute_in_unification_problem_def, [sub, obj('UnificationProblem', rest(ues.value))])
                ])
            ]
        ])
    ))
)

// (Substitution, UnificationEquation) => UnificationEquation
export const substitute_in_unification_equation_def = operator_definition<TermOVM, TermEVM>('substitute_in_unification_equation_def', ['substitution', 'problem'], (inputs) =>
    expect_sub(inputs[0], (sub) => expect_unification_equation(inputs[1], (ue) =>
        operator_app(make_unification_equation_def, [
            operator_app(apply_substitution_def_2, [sub, ue.value.left]),
            operator_app(apply_substitution_def_2, [sub, ue.value.right])
        ])
    ))
)

export const make_unification_equation_def = operator_definition<TermOVM, TermEVM>('make_unification_equation', ['left', 'right'], (inputs) =>
    expect_term(inputs[0], (l) => expect_term(inputs[1], (r) =>
        obj('UnificationEquation', { left: l, right: r })
    ))
)

// (UnificationEquation, UnificationProblem) => 
export const cons_unification_problem_def = operator_definition<TermOVM, TermEVM>('cons_unification_problem_def', ['first_equation', 'rest_of_problem'], (inputs) =>
    expect_unification_equation(inputs[0], (ue) => expect_unification_problem(inputs[1], (ues) =>
        obj('UnificationProblem', [ue, ...ues.value])
    ))
)

// (Substitution, Variable, Term) => Substitution
export const add_to_substitution_def = operator_definition<TermOVM, TermEVM>('add_to_substitution', ['substitution', 'variable', 'term'], (inputs) =>
    expect_sub(inputs[0], (sub) => expect_variable(inputs[1], (v) => expect_term(inputs[2], (t) =>
        options_tree([
            ['at_end_of_substitution', () => expect_empty_sub(sub, () => obj('NonEmptySub', { variable: v, term: t, rest: obj<TermOVM, 'EmptySub'>('EmptySub', []) }))],
            ['not_at_end_of_substitution', () => expect_non_empty_sub(sub, (nes) => operator_app(cons_sub_def, [
                nes.value.variable,
                operator_app(apply_substitution_def_2, [obj('NonEmptySub', { variable: v, term: t, rest: obj<TermOVM, 'EmptySub'>('EmptySub', []) }), nes.value.term]),
                operator_app(add_to_substitution_def, [nes.value.rest, v, t])
            ]))]
        ])
    )))
)

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////// PLAYING WITH TERMS ////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const succ_options = (): OptionsTree<NatOVM, NatEVM> =>
    options_tree([
        ['error', () => err('WithMessage', 'random error')],
        ['succ', () => operator_app(succ_def, [succ_options()])],
        ['zero', () => obj('Natural_Number', 0)]
    ])

export const succ_def = operator_definition<NatOVM, NatEVM>('succ', ['n'], (inputs) =>
    expect_natural(inputs[0], (n) =>
        obj('Natural_Number', n.value + 1)
    )
)

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////// BINARY TREES ///////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type BinaryTree = 'EmptyBinTree' | 'NonEmptyBinTree'

export const expect_binary_tree = expect_types<NatOVM, NatEVM, 'EmptyBinTree' | 'NonEmptyBinTree'>('EmptyBinTree', 'NonEmptyBinTree')

export const binary_tree_options = (): CoastlineControl<NatOVM, NatEVM> =>
    options_tree<NatOVM, NatEVM>([
        ['error', () => err('WithMessage', 'User did an error!')],
        ['empty_binary_tree', () => operator_app(empty_binary_tree_def, [
            req2('Natural_Number')
        ])],
        ['non_empty_binary_tree', () => operator_app(non_empty_binary_tree_def, [
            req2('Natural_Number'),
            binary_tree_options(),
            binary_tree_options()
        ])]
    ])

export const empty_binary_tree_def = operator_definition<NatOVM, NatEVM>('empty_binary_tree_def', ['value'], (inputs) =>
    expect_natural(inputs[0], (num) =>
        obj('EmptyBinTree', { num })
    )
)

export const non_empty_binary_tree_def = operator_definition<NatOVM, NatEVM>('non_empty_binary_tree_def', ['value', 'left', 'right'], (inputs) =>
    expect_natural(inputs[0], (num) => expect_binary_tree(inputs[1], (left) => expect_binary_tree(inputs[2], (right) =>
        obj('NonEmptyBinTree', { num, left, right })
    )))
)

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////// MERGE SORT ////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const expect_natural_list = expect_type<NatOVM, NatEVM, 'NaturalList'>('NaturalList')

// (NaturalList) => NaturalList
export const merge_sort_def = operator_definition<NatOVM, NatEVM>('merge_sort', ['list'], (inputs) =>
    expect_natural_list(inputs[0], (list) =>
        options_tree([
            ['list_is_trivially_sorted', () => list.value.length > 1 ? err('WithMessage', 'A list is only trivially sorted if its length is <= 1!') : list],
            ['split_sort_and_merge', () => list.value.length <= 1 ? err('WithMessage', 'You can\'t split, sort, and merge a list whose length if <= 1!') : operator_app(merge_def, [
                operator_app(merge_sort_def, [skipped_list_before_index(list, obj('Natural_Number', Math.floor(list.value.length / 2)))]),
                operator_app(merge_sort_def, [skipped_list_after_index(list, obj('Natural_Number', Math.floor(list.value.length / 2)))])
            ])]
        ])
    )
)

const skipped_list_before_index = (list: CoastlineObject<NatOVM, 'NaturalList'>, index: CoastlineObject<NatOVM, 'Natural_Number'>): CoastlineControl<NatOVM, NatEVM> => {
    if (index.value < 0 || index.value >= list.value.length)
        return err('WithMessage', `Index ${index} is out of bounds 0 <= i < ${list.value.length}!`)
    return obj('NaturalList', list.value.slice(0, index.value))
}

const skipped_list_after_index = (list: CoastlineObject<NatOVM, 'NaturalList'>, index: CoastlineObject<NatOVM, 'Natural_Number'>): CoastlineControl<NatOVM, NatEVM> => {
    if (index.value < 0 || index.value >= list.value.length)
        return err('WithMessage', `Index ${index} is out of bounds 0 <= i < ${list.value.length}!`)
    return obj('NaturalList', list.value.slice(index.value, list.value.length))
}

// (NaturalList, NaturalList) => NaturalList
export const merge_def = operator_definition<NatOVM, NatEVM>('merge', ['left_list', 'right_list'], (inputs) =>
    expect_natural_list(inputs[0], (left) => expect_natural_list(inputs[1], (right) =>
        options_tree([
            ['add_rest_of_left_list', () => right.value.length !== 0 ? err('WithMessage', 'You can only add the rest of the left list if the left list is empty!') : left],
            ['add_rest_of_right_list', () => left.value.length !== 0 ? err('WithMessage', 'You can only add the rest of the right list if the right list is empty!') : right],
            ['add_head_of_left_list_first', () =>
                left.value.length === 0 ? err('WithMessage', 'You can\'t add the head of the left list if the left list is empty!')
                : right.value.length !== 0 && first(left.value).value > first(right.value).value ? err('WithMessage', 'You can only add the left list\'s head first if it is <= the right list\'s head!')
                : operator_app(cons_natural_list_def, [
                    first(left.value),
                    operator_app(merge_def, [
                        obj('NaturalList', rest(left.value)),
                        right
                    ])
                ])],
            ['add_head_of_right_list_first', () =>
                right.value.length === 0 ? err('WithMessage', 'You can\'t add the head of the right list if the right list is empty!')
                : left.value.length !== 0 && first(right.value).value > first(left.value).value ? err('WithMessage', 'You can only add the the right list\'s head first if it is <= the left list\'s head!')
                : operator_app(cons_natural_list_def, [
                    first(right.value),
                    operator_app(merge_def, [
                        left,
                        obj('NaturalList', rest(right.value))
                    ])
                ])]
        ])
    ))
)

export const cons_natural_list_def = operator_definition<NatOVM, NatEVM>('cons_natural_list', ['head', 'tail'], (inputs) =>
    expect_natural(inputs[0], (head) => expect_natural_list(inputs[1], (tail) =>
        obj('NaturalList', [head, ...tail.value])
    ))
)

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////// ARITHMETIC EXPRESSION EVALUATION /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type ArithmeticExpression = 'Integer' | 'NegativeExpression' | 'PlusExpression' | 'MinusExpression' | 'TimesExpression'

export type ArithmeticOVM = {
    Integer: number
    NegativeExpression: { expression: CoastlineObject<ArithmeticOVM, ArithmeticExpression> }
    PlusExpression: { left: CoastlineObject<ArithmeticOVM, ArithmeticExpression>, right: CoastlineObject<ArithmeticOVM, ArithmeticExpression> },
    MinusExpression: { left: CoastlineObject<ArithmeticOVM, ArithmeticExpression>, right: CoastlineObject<ArithmeticOVM, ArithmeticExpression> },
    TimesExpression: { left: CoastlineObject<ArithmeticOVM, ArithmeticExpression>, right: CoastlineObject<ArithmeticOVM, ArithmeticExpression> }
}

export type ArithmeticEVM = {
    WithMessage: string
}

export const expect_arithmetic_expression = expect_types<ArithmeticOVM, ArithmeticEVM, ArithmeticExpression>('Integer', 'NegativeExpression', 'PlusExpression', 'MinusExpression', 'TimesExpression')
export const expect_integer = expect_type<ArithmeticOVM, ArithmeticEVM, 'Integer'>('Integer')
export const expect_negative_expression = expect_type<ArithmeticOVM, ArithmeticEVM, 'NegativeExpression'>('NegativeExpression')
export const expect_plus_expression = expect_type<ArithmeticOVM, ArithmeticEVM, 'PlusExpression'>('PlusExpression')
export const expect_minus_expression = expect_type<ArithmeticOVM, ArithmeticEVM, 'MinusExpression'>('MinusExpression')
export const expect_times_expression = expect_type<ArithmeticOVM, ArithmeticEVM, 'TimesExpression'>('TimesExpression')

export const evaluate_arithmetic_expression_def = operator_definition<ArithmeticOVM, ArithmeticEVM>('evaluate_arithmetic_expression', ['expression'], (inputs) =>
    expect_arithmetic_expression(inputs[0], (expression) =>
        options_tree([
            ['Finished Evaluating', () => expect_integer(expression, () => expression)],
            ['Evaluate the Inner Expression, then negate the result', () => expect_negative_expression(expression, (n) => operator_app(integer_negate_def, [n.value.expression]))],
            ['Evaluate Left, Evaluate Right, then Add the results together', () => expect_plus_expression(expression, (p) => operator_app(integer_plus_def, [
                operator_app(evaluate_arithmetic_expression_def, [p.value.left]),
                operator_app(evaluate_arithmetic_expression_def, [p.value.right])
            ]))],
            ['Evaluate Left, Evaluate Right, then Subtract the right result from the left result', () => expect_minus_expression(expression, (s) => operator_app(integer_minus_def, [
                operator_app(evaluate_arithmetic_expression_def, [s.value.left]),
                operator_app(evaluate_arithmetic_expression_def, [s.value.right])
            ]))],
            ['Evaluate Left, Evaluate Right, then Multiply the results together', () => expect_times_expression(expression, (t) => operator_app(integer_times_def, [
                operator_app(evaluate_arithmetic_expression_def, [t.value.left]),
                operator_app(evaluate_arithmetic_expression_def, [t.value.right])
            ]))]
        ])
    )
)

export const integer_negate_def = operator_definition<ArithmeticOVM, ArithmeticEVM>('negate', ['x'], (inputs) => expect_integer(inputs[0], (x) => obj('Integer', -x.value)))

export const mk_check_result_def = (actual_answer: number) => operator_definition<ArithmeticOVM, ArithmeticEVM>('check_result', ['user_answer'], (inputs) =>
    expect_integer(inputs[0], (user_answer) => user_answer.value !== actual_answer ? err('WithMessage', `${user_answer.value} is not the answer.  Try again!`) : obj('Integer', user_answer.value))
)

export const integer_plus_def = operator_definition<ArithmeticOVM, ArithmeticEVM>('plus', ['x', 'y'], (inputs) =>
    expect_integer(inputs[0], (x) => expect_integer(inputs[1], (y) =>
        operator_app(mk_check_result_def(x.value + y.value), [
            req2('Integer')
        ])
    ))
)

export const integer_minus_def = operator_definition<ArithmeticOVM, ArithmeticEVM>('minus', ['x', 'y'], (inputs) =>
    expect_integer(inputs[0], (x) => expect_integer(inputs[1], (y) =>
        operator_app(mk_check_result_def(x.value - y.value), [
            req2('Integer')
        ])
    ))
)

export const integer_times_def = operator_definition<ArithmeticOVM, ArithmeticEVM>('times', ['x', 'y'], (inputs) =>
    expect_integer(inputs[0], (x) => expect_integer(inputs[1], (y) =>
        operator_app(mk_check_result_def(x.value * y.value), [
            req2('Integer')
        ])
    ))
)

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////// PIERCE TYPES AND PROGRAMMING LANGUAGES //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export type PTermOVM = {
    Natural_Number: number
    PierceTerm:
        | 'true'
        | 'false'
        | { if: CoastlineObject<PTermOVM, 'PierceTerm'>, then: CoastlineObject<PTermOVM, 'PierceTerm'>, else: CoastlineObject<PTermOVM, 'PierceTerm'> }
        | '0'
        | { succ: CoastlineObject<PTermOVM, 'PierceTerm'> }
        | { pred: CoastlineObject<PTermOVM, 'PierceTerm'> }
        | { iszero: CoastlineObject<PTermOVM, 'PierceTerm'> }
    PierceTermSet: CoastlineObject<PTermOVM, 'PierceTerm'>[]
}

export type PTermEVM = {
    WithMessage: string
}

export type PT = CoastlineObject<PTermOVM, 'PierceTerm'>
export const expect_pierce_term = expect_type<PTermOVM, PTermEVM, 'PierceTerm'>('PierceTerm')
export const expect_pierce_term_set = expect_type<PTermOVM, PTermEVM, 'PierceTermSet'>('PierceTermSet')
export const pnat = object_constructor<PTermOVM, 'Natural_Number'>('Natural_Number')

export const make_pierce_term_options_tree = (): CoastlineControl<PTermOVM, PTermEVM> =>
    options_tree([
        ['true', () => obj('PierceTerm', 'true')],
        ['false', () => obj('PierceTerm', 'false')],
        ['if-then-else', () => operator_app(if_then_else_def, [
            make_pierce_term_options_tree(),
            make_pierce_term_options_tree(),
            make_pierce_term_options_tree()
        ])],
        ['0', () => obj('PierceTerm', '0')],
        ['succ', () => operator_app(pierce_succ_def, [
            make_pierce_term_options_tree()
        ])],
        ['pred', () => operator_app(pred_def, [
            make_pierce_term_options_tree()
        ])],
        ['iszero', () => operator_app(iszero_def, [
            make_pierce_term_options_tree()
        ])]
    ])

export const if_then_else_def = operator_definition<PTermOVM, PTermEVM>('if_then_else', ['t1', 't2', 't3'], (inputs) =>
    expect_pierce_term(inputs[0], (t1) => expect_pierce_term(inputs[1], (t2) => expect_pierce_term(inputs[2], (t3) =>
        obj('PierceTerm', { if: t1, then: t2, else: t3})
    )))
)

export const pierce_succ_def = operator_definition<PTermOVM, PTermEVM>('succ', ['t'], (inputs) =>
    expect_pierce_term(inputs[0], (t) => obj('PierceTerm', { succ: t }))
)

export const pred_def = operator_definition<PTermOVM, PTermEVM>('pred', ['t'], (inputs) =>
    expect_pierce_term(inputs[0], (t) => obj('PierceTerm', { pred: t }))
)

export const iszero_def = operator_definition<PTermOVM, PTermEVM>('iszero', ['t'], (inputs) =>
    expect_pierce_term(inputs[0], (t) => obj('PierceTerm', { iszero: t }))
)

export const expect_pierce_natural = expect_type<PTermOVM, PTermEVM, 'Natural_Number'>('Natural_Number')

// (Natural_Number) => PierceTermSet
export const terms_set_def = operator_definition<PTermOVM, PTermEVM>('terms_set', ['n'], (inputs) =>
    expect_pierce_natural(inputs[0], (n) =>
        n.value === 0 ? obj('PierceTermSet', [])
        : operator_app(union_pierce_term_sets_def, [
            obj('PierceTermSet', [obj('PierceTerm', 'true'), obj('PierceTerm', 'false'), obj('PierceTerm', '0')]),
            operator_app(
                make_declare_pierce_term_set_then_op_def('declare_term_set_n_minus_1', (set_n_minus_1) =>
                    operator_app(union_pierce_term_sets_def, [
                        operator_app(succ_terms_set_def, [set_n_minus_1]),
                        operator_app(union_pierce_term_sets_def, [
                            operator_app(pred_terms_set_def, [set_n_minus_1]),
                            operator_app(union_pierce_term_sets_def, [
                                operator_app(iszero_terms_set_def, [set_n_minus_1]),
                                operator_app(if_then_else_terms_set_def, [set_n_minus_1])
                            ])
                        ])
                    ])
                ), [
                    operator_app(terms_set_def, [obj('Natural_Number', n.value - 1)])
                ]
            )
        ])
    )
)

export const make_declare_pierce_term_set_then_op_def = (
    op_name: string,
    control_f: (c: CoastlineObject<PTermOVM, 'PierceTermSet'>) => CoastlineControl<PTermOVM, PTermEVM>
): OperatorDefinition<PTermOVM, PTermEVM> =>
    operator_definition(op_name, ['list'], (inputs) =>
        expect_pierce_term_set(inputs[0], (list) => control_f(list)))

// (PierceTermSet, PierceTermSet) => PierceTermSet
export const union_pierce_term_sets_def = operator_definition<PTermOVM, PTermEVM>('union', ['l1', 'l2'], (inputs) =>
    expect_pierce_term_set(inputs[0], (l1) => expect_pierce_term_set(inputs[1], (l2) =>
        obj('PierceTermSet', unionWith(l1.value, l2.value, isEqual))
    ))
)

export const succ_terms_set_def = operator_definition<PTermOVM, PTermEVM>('succ_terms_set', ['term_set'], (inputs) =>
    expect_pierce_term_set(inputs[0], (term_set) =>
        obj('PierceTermSet', term_set.value.map((t) => obj('PierceTerm', { succ: t })))
    )
)

export const pred_terms_set_def = operator_definition<PTermOVM, PTermEVM>('pred_terms_set', ['term_set'], (inputs) =>
    expect_pierce_term_set(inputs[0], (term_set) =>
        obj('PierceTermSet', term_set.value.map((t) => obj('PierceTerm', { pred: t })))
    )
)

export const iszero_terms_set_def = operator_definition<PTermOVM, PTermEVM>('iszero_terms_set', ['term_set'], (inputs) =>
    expect_pierce_term_set(inputs[0], (term_set) =>
        obj('PierceTermSet', term_set.value.map((t) => obj('PierceTerm', { iszero: t })))
    )
)

export const if_then_else_terms_set_def = operator_definition<PTermOVM, PTermEVM>('if_then_else_set', ['term_set'], (inputs) =>
    expect_pierce_term_set(inputs[0], (term_set) => {
        const ret_set: CoastlineObject<PTermOVM, 'PierceTermSet'> = obj('PierceTermSet', [])
        for (const t1 of term_set.value)
            for (const t2 of term_set.value)
                for (const t3 of term_set.value)
                    ret_set.value.push(obj('PierceTerm', { if: t1, then: t2, else: t3 }))
        return ret_set
    })
)

// (PierceTermSet) => Natural_Number
export const pierce_set_size_def = operator_definition<PTermOVM, PTermEVM>('pierce_set_size', ['set'], (inputs) =>
    expect_pierce_term_set(inputs[0], (set) =>
        obj('Natural_Number', set.value.length)
    )
)

const pierce_term_cases = (
    term: PT,
    clause_true: [string, () => CoastlineControl<PTermOVM, PTermEVM>],
    clause_false: [string, () => CoastlineControl<PTermOVM, PTermEVM>],
    clause_0: [string, () => CoastlineControl<PTermOVM, PTermEVM>],
    clause_succ: [string, (t: PT) => CoastlineControl<PTermOVM, PTermEVM>],
    clause_pred: [string, (t: PT) => CoastlineControl<PTermOVM, PTermEVM>],
    clause_iszero: [string, (t: PT) => CoastlineControl<PTermOVM, PTermEVM>],
    clause_if_then_else: [string, (t1: PT, t2: PT, t3: PT) => CoastlineControl<PTermOVM, PTermEVM>]
): CoastlineControl<PTermOVM, PTermEVM> => options_tree([
        [clause_true[0], () => term.value !== 'true' ? err('WithMessage', 'The given Term is not \'true\'.') : clause_true[1]()],
        [clause_false[0], () => term.value !== 'false' ? err('WithMessage', 'The given Term is not \'false\'') : clause_false[1]()],
        [clause_0[0], () => term.value !== '0' ? err('WithMessage', 'The given Term is not \'0\'') : clause_0[1]()],
        [clause_succ[0], () => is_string(term.value) || !('succ' in term.value) ? err('WithMessage', 'The given Term is not \'succ t\' for some term t')
            : clause_succ[1](term.value.succ)],
        [clause_pred[0], () => is_string(term.value) || !('pred' in term.value) ? err('WithMessage', 'The given Term is not \'pred t\' for some term t')
            : clause_pred[1](term.value.pred)],
        [clause_iszero[0], () => is_string(term.value) || !('iszero' in term.value) ? err('WithMessage', 'The given Term is not \'iszero t\' for some term t')
            : clause_iszero[1](term.value.iszero)],
        [clause_if_then_else[0], () => is_string(term.value) || !('if' in term.value) ? err('WithMessage', 'The given Term is not \'iszero t\' for some term t')
            : clause_if_then_else[1](term.value.if, term.value.then, term.value.else)]
    ])

export const constants_in_pierce_term_def = operator_definition<PTermOVM, PTermEVM>('constants_in_pierce_term', ['term'], (inputs) =>
    expect_pierce_term(inputs[0], (term) => pierce_term_cases(term,
        ['input_is_true', () => obj('PierceTermSet', [term])],
        ['input_is_false', () => obj('PierceTermSet', [term])],
        ['input_is_0', () => obj('PierceTermSet', [term])],
        ['input_is_succ', (t) => operator_app(constants_in_pierce_term_def, [t])],
        ['input_is_pred', (t) => operator_app(constants_in_pierce_term_def, [t])],
        ['input_is_iszero', (t) => operator_app(constants_in_pierce_term_def, [t])],
        ['input_is_if_then_else', (t1, t2, t3) =>
            operator_app(union_pierce_term_sets_def, [
                operator_app(constants_in_pierce_term_def, [t1]),
                operator_app(union_pierce_term_sets_def, [
                    operator_app(constants_in_pierce_term_def, [t2]),
                    operator_app(constants_in_pierce_term_def, [t3])
                ])
            ])
        ]
    ))
)

export const p_plus_def = operator_definition<PTermOVM, PTermEVM>('plus', ['n1', 'n2'], (inputs) =>
    expect_pierce_natural(inputs[0], (n1) =>
        expect_pierce_natural(inputs[1], (n2) =>
            obj('Natural_Number', n1.value + n2.value)
        )
    )
)

// (PierceTerm) => Natural_Number
export const size_of_pierce_term_def = operator_definition<PTermOVM, PTermEVM>('size_of_pierce_term', ['term'], (inputs) =>
    expect_pierce_term(inputs[0], (term) => pierce_term_cases(term,
        ['input_is_true', () => pnat(1)],
        ['input_is_false', () => pnat(1)],
        ['input_is_0', () => pnat(1)],
        ['input_is_succ', (t) => operator_app(p_plus_def, [
            operator_app(size_of_pierce_term_def, [t]),
            pnat(1)
        ])],
        ['input_is_pred', (t) => operator_app(p_plus_def, [
            operator_app(size_of_pierce_term_def, [t]),
            pnat(1)
        ])],
        ['input_is_iszero', (t) => operator_app(p_plus_def, [
            operator_app(size_of_pierce_term_def, [t]),
            pnat(1)
        ])],
        ['input_is_if_then_else', (t1, t2, t3) => operator_app(p_plus_def, [
            operator_app(size_of_pierce_term_def, [t1]),
            operator_app(p_plus_def, [
                operator_app(size_of_pierce_term_def, [t2]),
                operator_app(size_of_pierce_term_def, [t3]),
            ])
        ])]
    ))
)

export const p_max_def = operator_definition<PTermOVM, PTermEVM>('max', ['n1', 'n2'], (inputs) =>
    expect_pierce_natural(inputs[0], (n1) => expect_pierce_natural(inputs[1], (n2) => n1.value >= n2.value ? n1 : n2)))

// (PierceTerm) => Natural_Number
export const depth_of_pierce_term_def = operator_definition<PTermOVM, PTermEVM>('depth_of_pierce_term', ['term'], (inputs) =>
    expect_pierce_term(inputs[0], (term) => pierce_term_cases(term,
        ['input_is_true', () => pnat(1)],
        ['input_is_false', () => pnat(1)],
        ['input_is_0', () => pnat(1)],
        ['input_is_succ', (t) => operator_app(p_plus_def, [
            operator_app(size_of_pierce_term_def, [t]),
            pnat(1)
        ])],
        ['input_is_pred', (t) => operator_app(p_plus_def, [
            operator_app(size_of_pierce_term_def, [t]),
            pnat(1)
        ])],
        ['input_is_iszero', (t) => operator_app(p_plus_def, [
            operator_app(size_of_pierce_term_def, [t]),
            pnat(1)
        ])],
        ['input_is_if_then_else', (t1, t2, t3) => operator_app(p_max_def, [
            operator_app(depth_of_pierce_term_def, [t1]),
            operator_app(p_max_def, [
                operator_app(depth_of_pierce_term_def, [t2]),
                operator_app(depth_of_pierce_term_def, [t3]),
            ])
        ])]
    ))
)

export const evaluate_boolean_pierce_term_def = operator_definition<PTermOVM, PTermEVM>('evaluate_boolean_pierce_term', ['term'], (inputs) =>
    expect_pierce_term(inputs[0], (term) =>
        !is_string(term.value) && !('if' in term.value) ? err('WithMessage', 'The given Pierce Term is not a boolean Term, so you can\'t run this function with it.')
        : options_tree([
            ['Already a Value', () => !is_string(term.value) ? err('WithMessage', 'The given Term is not already a Value') : term],
            ['An If Term that should evaluate to it\'s then clause', () =>
                is_string(term.value) || !('if' in term.value)
                    ? err('WithMessage', 'Given Term is not an If Term')
                    : term.value.if.value === 'false' ? err('WithMessage', 'An If Term whose first clause is \'false\' does not run its then clause')
                    : term.value.then],
            ['An If Term that should evaluate to it\'s else clause', () =>
                is_string(term.value) || !('if' in term.value)
                    ? err('WithMessage', 'Given Term is not an If Term')
                    : term.value.if.value === 'true' ? err('WithMessage', 'An If Term whose first clause is \'true\' does not run its else clause')
                    : term.value.else],
            ['An If Term that should evaluate it\'s if clause before evaluating it\'s then or else clause', () =>
                is_string(term.value) || !('if' in term.value)
                    ? err('WithMessage', 'Given Term is not an If Term')
                    : operator_app(evaluate_boolean_pierce_term_def, [
                        operator_app(if_then_else_def, [
                            operator_app(evaluate_boolean_pierce_term_def, [
                                term.value.if
                            ]),
                            term.value.then,
                            term.value.else
                        ])
                    ])
            ],
        ])
    )
)

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////// EXTENDED CALCULUS OF CONSTRUCTIONS ////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export type ECCTermOVM = {
    String: string
    Natural_Number: number
    Confirmation: undefined
    Boolean : boolean
    ECCProp: undefined
    ECCType: number
    ECCVariable: string
    ECCApplication: { head: CoastlineObject<ECCTermOVM, ECCTerm>, arg: CoastlineObject<ECCTermOVM, ECCTerm> }
    ECCArrow: { input: CoastlineObject<ECCTermOVM, ECCTerm>, output: CoastlineObject<ECCTermOVM, ECCTerm> }
    ECCProduct: { left: CoastlineObject<ECCTermOVM, ECCTerm>, right: CoastlineObject<ECCTermOVM, ECCTerm> }
    ECCPi: { bound: CoastlineObject<ECCTermOVM, 'ECCVariable'>, bound_type: CoastlineObject<ECCTermOVM, ECCTerm>, scope: CoastlineObject<ECCTermOVM, ECCTerm> }
    ECCLambda: { bound: CoastlineObject<ECCTermOVM, 'ECCVariable'>, bound_type: CoastlineObject<ECCTermOVM, ECCTerm>, scope: CoastlineObject<ECCTermOVM, ECCTerm> }
    ECCSigma: { bound: CoastlineObject<ECCTermOVM, 'ECCVariable'>, bound_type: CoastlineObject<ECCTermOVM, ECCTerm>, scope: CoastlineObject<ECCTermOVM, ECCTerm> }
    ECCPair: { pair_type: CoastlineObject<ECCTermOVM, ECCTerm>, left: CoastlineObject<ECCTermOVM, ECCTerm>, right: CoastlineObject<ECCTermOVM, ECCTerm> }
    ECCProject: { project: 'left' | 'right', pair: CoastlineObject<ECCTermOVM, ECCTerm> }
    ECCTermSet: CoastlineObject<ECCTermOVM, ECCTerm>[]
    ECCSD: number
    ECCSDContext: CoastlineObject<ECCTermOVM, 'ECCVariable'>[]
}

export type ECCTermEVM = {
    WithMessage: string
}

export type ECCTerm = 'ECCProp' | 'ECCType' | 'ECCVariable' | 'ECCSD' | 'ECCPair' | 'ECCProject' | 'ECCApplication' | 'ECCArrow' | 'ECCProduct' | 'ECCPi' | 'ECCLambda' | 'ECCSigma' | 'ECCTermSet'
export type ECCBinder = 'ECCPi' | 'ECCLambda' | 'ECCSigma'

const expect_ecc_term = expect_types<ECCTermOVM, ECCTermEVM, ECCTerm>(...ecc_term_types)
const expect_ecc_prop = expect_type<ECCTermOVM, ECCTermEVM, 'ECCProp'>('ECCProp')
const expect_ecc_type = expect_type<ECCTermOVM, ECCTermEVM, 'ECCType'>('ECCType')
const expect_ecc_variable = expect_type<ECCTermOVM, ECCTermEVM, 'ECCVariable'>('ECCVariable')
const expect_ecc_sd = expect_type<ECCTermOVM, ECCTermEVM, 'ECCSD'>('ECCSD')
const expect_ecc_pair = expect_type<ECCTermOVM, ECCTermEVM, 'ECCPair'>('ECCPair')
const expect_ecc_projection = expect_type<ECCTermOVM, ECCTermEVM, 'ECCProject'>('ECCProject')
const expect_ecc_application = expect_type<ECCTermOVM, ECCTermEVM, 'ECCApplication'>('ECCApplication')
const expect_ecc_arrow = expect_type<ECCTermOVM, ECCTermEVM, 'ECCArrow'>('ECCArrow')
const expect_ecc_product = expect_type<ECCTermOVM, ECCTermEVM, 'ECCProduct'>('ECCProduct')
const expect_ecc_pi = expect_type<ECCTermOVM, ECCTermEVM, 'ECCPi'>('ECCPi')
const expect_ecc_lambda = expect_type<ECCTermOVM, ECCTermEVM, 'ECCLambda'>('ECCLambda')
const expect_ecc_sigma = expect_type<ECCTermOVM, ECCTermEVM, 'ECCSigma'>('ECCSigma')
const expect_ecc_binder = expect_types<ECCTermOVM, ECCTermEVM, ECCBinder>('ECCPi', 'ECCLambda', 'ECCSigma')
const expect_ecc_term_set = expect_type<ECCTermOVM, ECCTermEVM, 'ECCTermSet'>('ECCTermSet')
const expect_ecc_natural = expect_type<ECCTermOVM, ECCTermEVM, 'Natural_Number'>('Natural_Number')
const expect_ecc_string = expect_type<ECCTermOVM, ECCTermEVM, 'String'>('String')
const expect_ecc_boolean = expect_type<ECCTermOVM, ECCTermEVM, 'Boolean'>('Boolean')
const ecc_term_set = (...terms: CoastlineObject<ECCTermOVM, ECCTerm>[]): CoastlineObject<ECCTermOVM, 'ECCTermSet'> => obj('ECCTermSet', terms)

export const type_universe_def = operator_definition<ECCTermOVM, ECCTermEVM>('type_universe', ['order'], (inputs) =>
    expect_ecc_natural(inputs[0], (order) => obj('ECCType', order.value)))

export const variable_def = operator_definition<ECCTermOVM, ECCTermEVM>('variable', ['id'], (inputs) =>
    expect_ecc_string(inputs[0], (id) => obj('ECCVariable', id.value)))

export const sd_def = operator_definition<ECCTermOVM, ECCTermEVM>('static_distance', ['index'], (inputs) =>
    expect_ecc_natural(inputs[0], (index) => obj('ECCSD', index.value)))

export const application_def = operator_definition<ECCTermOVM, ECCTermEVM>('application', ['head', 'arg'], (inputs) =>
    expect_ecc_term(inputs[0], (head) => expect_ecc_term(inputs[1], (arg) => obj('ECCApplication', { head, arg }))))

export const arrow_def = operator_definition<ECCTermOVM, ECCTermEVM>('arrow', ['input_type', 'output_type'], (inputs) =>
    expect_ecc_term(inputs[0], (input) => expect_ecc_term(inputs[1], (output) => obj('ECCArrow', { input, output }))))

export const product_def = operator_definition<ECCTermOVM, ECCTermEVM>('product', ['left_type', 'right_type'], (inputs) =>
    expect_ecc_term(inputs[0], (left) => expect_ecc_term(inputs[1], (right) => obj('ECCProduct', { left, right }))))

export const pi_def = operator_definition<ECCTermOVM, ECCTermEVM>('pi', ['bound', 'bound_type', 'scope'], (inputs) =>
    expect_ecc_variable(inputs[0], (bound) => expect_ecc_term(inputs[1], (bound_type) => expect_ecc_term(inputs[2], (scope) =>
        { throw new Error }))))
        // operator_app(ecc_term_abbreviate_def, [obj('ECCPi', { bound, bound_type, scope })])))))

export const sigma_def = operator_definition<ECCTermOVM, ECCTermEVM>('sigma', ['bound', 'bound_type', 'scope'], (inputs) =>
    expect_ecc_variable(inputs[0], (bound) => expect_ecc_term(inputs[1], (bound_type) => expect_ecc_term(inputs[2], (scope) =>
        { throw new Error }))))
        // operator_app(ecc_term_abbreviate_def, [obj('ECCSigma', { bound, bound_type, scope })])))))

export const lambda_def = operator_definition<ECCTermOVM, ECCTermEVM>('lambda', ['bound', 'bound_type', 'scope'], (inputs) =>
    expect_ecc_variable(inputs[0], (bound) => expect_ecc_term(inputs[1], (bound_type) => expect_ecc_term(inputs[2], (scope) =>
        obj('ECCLambda', { bound, bound_type, scope })))))

export const pair_def = operator_definition<ECCTermOVM, ECCTermEVM>('pair', ['pair_type', 'left', 'right'], (inputs) =>
    expect_ecc_term(inputs[0], (pair_type) => expect_ecc_term(inputs[1], (left) => expect_ecc_term(inputs[2], (right) =>
        obj('ECCPair', { pair_type, left, right })))))

export const left_projection_def = operator_definition<ECCTermOVM, ECCTermEVM>('left_projection', ['pair'], (inputs) =>
    expect_ecc_term(inputs[0], (pair) => obj('ECCProject', { project: 'left', pair })))

export const right_projection_def = operator_definition<ECCTermOVM, ECCTermEVM>('right_projection', ['pair'], (inputs) =>
    expect_ecc_term(inputs[0], (pair) => obj('ECCProject', { project: 'right', pair })))

export const ecc_term_options = (): CoastlineControl<ECCTermOVM, ECCTermEVM> => options_tree([
    ['Prop', () => obj('ECCProp', undefined)],
    ['Type', () => operator_app(type_universe_def, [req2('Natural_Number')])],
    ['Variable', () => operator_app(variable_def, [req2('String')])],
    ['Static Distance', () => operator_app(sd_def, [req2('Natural_Number')])],
    ['Application', () => operator_app(application_def, [
        ecc_term_options(),
        ecc_term_options()
    ])],
    ['Arrow', () => operator_app(arrow_def, [
        ecc_term_options(),
        ecc_term_options()
    ])],
    ['Product', () => operator_app(product_def, [
        ecc_term_options(),
        ecc_term_options()
    ])],
    ['Pi', () => operator_app(pi_def, [
        operator_app(variable_def, [req2('String')]),
        ecc_term_options(),
        ecc_term_options()
    ])],
    ['Lambda', () => operator_app(lambda_def, [
        operator_app(variable_def, [req2('String')]),
        ecc_term_options(),
        ecc_term_options()
    ])],
    ['Sigma', () => operator_app(sigma_def, [
        operator_app(variable_def, [req2('String')]),
        ecc_term_options(),
        ecc_term_options()
    ])],
    ['Pair', () => operator_app(pair_def, [
        ecc_term_options(),
        ecc_term_options(),
        ecc_term_options()
    ])],
    ['Left Projection', () => operator_app(left_projection_def, [
        ecc_term_options()
    ])],
    ['Right Projection', () => operator_app(right_projection_def, [
        ecc_term_options()
    ])]
])

export const check_ecc_free_variables = (term: CoastlineObject<ECCTermOVM, ECCTerm>): CoastlineControl<ECCTermOVM, ECCTermEVM> =>
    check_coastline_correctness(
        ecc_free_variables(term),
        operator_app(ecc_free_variables_def, [term])
    )

const ecc_free_variables = (term: CoastlineObject<ECCTermOVM, ECCTerm>): CoastlineObject<ECCTermOVM, 'ECCTermSet'> => {
    if (cta('ECCProp', term) || cta('ECCType', term))
        return ecc_term_set()
    if (cta('ECCVariable', term))
        return ecc_term_set(term)
    if (cta('ECCApplication', term))
        return ecc_term_set(...unionWith(
            ecc_free_variables(term.value.head).value,
            ecc_free_variables(term.value.arg).value,
            isEqual
        ))
    if (cta('ECCPair', term))
        return ecc_term_set(...unionWith(
            ecc_free_variables(term.value.pair_type).value,
            ecc_free_variables(term.value.left).value,
            ecc_free_variables(term.value.right).value,
            isEqual
        ))
    if (cta('ECCProject', term))
        return ecc_term_set(...ecc_free_variables(term.value.pair).value)
    if (cta('ECCPi', term) || cta('ECCLambda', term) || cta('ECCSigma', term))
        return ecc_term_set(...unionWith(
            ecc_free_variables(term.value.bound_type).value,
            remove_from_ecc_term_set(term.value.bound, ecc_free_variables(term.value.scope)).value,
            isEqual
        ))
    return ecc_term_set()
}

// (ECCTerm) => ECCTermSet
export const ecc_free_variables_def = operator_definition<ECCTermOVM, ECCTermEVM>('free_variables', ['term'], (inputs) =>
    expect_ecc_term(inputs[0], (term) => options_tree([
        // ['no_free_variables', () => ],
        ['prop', () => expect_ecc_prop(term, () => ecc_term_set())],
        ['type', () => expect_ecc_type(term, () => ecc_term_set())],
        ['variable', () => expect_ecc_variable(term, (v) => ecc_term_set(v))],
        ['static distance', () => expect_ecc_sd(term, () => ecc_term_set())],
        ['application', () => expect_ecc_application(term, (app) =>
            operator_app(union_ecc_term_set_def, [
                operator_app(ecc_free_variables_def, [app.value.head]),
                operator_app(ecc_free_variables_def, [app.value.arg])
            ]))
        ],
        ['pair', () => expect_ecc_pair(term, (pair) => operator_app(union_ecc_term_set_def, [
            operator_app(ecc_free_variables_def, [pair.value.pair_type]),
            operator_app(union_ecc_term_set_def, [
                operator_app(ecc_free_variables_def, [pair.value.left]),
                operator_app(ecc_free_variables_def, [pair.value.right]),
            ])
        ]))],
        ['projection', () => expect_ecc_projection(term, (project) => operator_app(ecc_free_variables_def, [project.value.pair]))],
        ['binder', () => expect_ecc_binder(term, (binder) =>
            operator_app(union_ecc_term_set_def, [
                operator_app(ecc_free_variables_def, [binder.value.bound_type]),
                operator_app(remove_from_ecc_term_set_def, [
                    binder.value.bound,
                    operator_app(ecc_free_variables_def, [binder.value.scope])
                ])
            ])
        )]
    ]))
)

const ecc_terms_syntactically_equal = (t1: CoastlineObject<ECCTermOVM, ECCTerm>, t2: CoastlineObject<ECCTermOVM, ECCTerm>): boolean => {
    if (cta('ECCProp', t1) && cta('ECCProp', t2))
        return true
    if (cta('ECCType', t1) && cta('ECCType', t2))
        return t1.value === t2.value
    if (cta('ECCVariable', t1) && cta('ECCVariable', t2))
        return t1.value === t2.value
    if (cta('ECCApplication', t1) && cta('ECCApplication', t2))
        return ecc_terms_syntactically_equal(t1.value.head, t2.value.arg)
            && ecc_terms_syntactically_equal(t1.value.arg, t2.value.arg)
    if ((cta('ECCPi', t1) && cta('ECCPi', t2)) || (cta('ECCLambda', t1) && cta('ECCLambda', t2)) || (cta('ECCSigma', t1) && cta('ECCSigma', t2)))
        return ecc_terms_syntactically_equal(t1.value.bound, t1.value.bound)
            && ecc_terms_syntactically_equal(t1.value.bound_type, t2.value.bound_type)
            && ecc_terms_syntactically_equal(t1.value.scope, t2.value.scope)
    if (cta('ECCPair', t1) && cta('ECCPair', t2))
        return ecc_terms_syntactically_equal(t1.value.pair_type, t2.value.pair_type)
            && ecc_terms_syntactically_equal(t1.value.left, t2.value.left)
            && ecc_terms_syntactically_equal(t1.value.right, t2.value.right)
    if (cta('ECCProject', t1) && cta('ECCProject', t2))
        return t1.value.project === t2.value.project
            && ecc_terms_syntactically_equal(t1.value.pair, t2.value.pair)
    return false
}

const ecc_term_appears_in_term_set = (term: CoastlineObject<ECCTermOVM, ECCTerm>, set: CoastlineObject<ECCTermOVM, 'ECCTermSet'>): boolean =>
    defined(set.value.find((t) => ecc_terms_syntactically_equal(term, t)))

export const union_ecc_term_set_def = operator_definition<ECCTermOVM, ECCTermEVM>('union_term_set', ['set1', 'set2'], (inputs) =>
    expect_ecc_term_set(inputs[0], (set1) => expect_ecc_term_set(inputs[1], (set2) => options_tree([
        ['set2_is_empty', () => set1],
        ['first_element_of_set2_is_not_in_set1', () =>
            set2.value.length === 0 ? operator_app(union_ecc_term_set_def, [set1, set2])
            : operator_app(union_ecc_term_set_def, [
                ecc_term_set(...set1.value, first(set2.value)),
                ecc_term_set(...rest(set2.value))
            ])],
        ['first_element_of_set2_is_in_set1', () =>
            set2.value.length === 0  ? operator_app(union_ecc_term_set_def, [set1, set2])
            : operator_app(union_ecc_term_set_def, [
                set1,
                ecc_term_set(...rest(set2.value))
            ])],
    ])))
)

const remove_from_ecc_term_set = (term: CoastlineObject<ECCTermOVM, ECCTerm>, set: CoastlineObject<ECCTermOVM, 'ECCTermSet'>): CoastlineObject<ECCTermOVM, 'ECCTermSet'> =>
    obj('ECCTermSet', set.value.filter((t) => !ecc_terms_syntactically_equal(term, t)))

const expect_confirmation = expect_type('Confirmation')

export const check_coastline_correctness = (actual_answer: AnyCoastlineObject<ECCTermOVM>, control: CoastlineControl<ECCTermOVM, ECCTermEVM>): CoastlineControl<ECCTermOVM, ECCTermEVM> => {
    const check_correctness_def = operator_definition<ECCTermOVM, ECCTermEVM>('check_correctness', ['confirmation', 'your_answer'], (inputs) =>
        declare(inputs[1], (your_answer) => {
            const your_answer_equals_actual_answer = isEqual(your_answer, actual_answer)
            if (your_answer_equals_actual_answer)
                return your_answer
            return err('WithMessage', `You made a mistake somewhere.  Try again.`)
        })
    )
    return operator_app(check_correctness_def, [
        options_tree([
            ['Check and Continue', () => obj('Confirmation', undefined)]
        ]),
        control
    ])
}

export const remove_from_ecc_term_set_def = operator_definition<ECCTermOVM, ECCTermEVM>('remove_from_term_set', ['term', 'set'], (inputs) =>
    expect_ecc_term(inputs[0], (term) => expect_ecc_term_set(inputs[1], (set) =>
        operator_app(remove_from_ecc_term_set_acc_def, [term, set, ecc_term_set()])
    ))
)

export const remove_from_ecc_term_set_acc_def = operator_definition<ECCTermOVM, ECCTermEVM>('remove_from_term_set_acc', ['term', 'set', 'set_to_return'], (inputs) =>
    expect_ecc_term(inputs[0], (term) => expect_ecc_term_set(inputs[1], (set) => expect_ecc_term_set(inputs[2], (set_to_return) =>
        options_tree([
            ['term_does_not_appear_in_set', () => obj('ECCTermSet', [...set_to_return.value, ...set.value])],
            ['remove_first_term_in_set', () =>
                set.value.length === 0 ? operator_app(remove_from_ecc_term_set_acc_def, [term, set, set_to_return])
                : operator_app(remove_from_ecc_term_set_acc_def, [
                    term,
                    obj('ECCTermSet', rest(set.value)),
                    set_to_return
                ])
            ],
            ['keep_first_term_in_set', () =>
                set.value.length === 0 ? operator_app(remove_from_ecc_term_set_acc_def, [term, set, set_to_return])
                : operator_app(remove_from_ecc_term_set_acc_def, [
                    term,
                    obj('ECCTermSet', rest(set.value)),
                    obj('ECCTermSet', [...set_to_return.value, first(set.value)])
                ])
            ]
        ])
    )))
)

export const check_ecc_term_abbreviate = (term: CoastlineObject<ECCTermOVM, ECCTerm>): CoastlineControl<ECCTermOVM, ECCTermEVM> =>
    { throw new Error('') }
    // check_coastline_correctness(
    //     ecc_term_abbreviate(term),
    //     operator_app(ecc_term_abbreviate_def, [term])
    // )

const ecc_term_abbreviate = (term: CoastlineObject<ECCTermOVM, ECCTerm>): CoastlineObject<ECCTermOVM, ECCTerm> => {
    if (cta('ECCPi', term)) {
        const bound_in_scope = defined(ecc_free_variables(term.value.scope).value.find((fv) => ecc_terms_syntactically_equal(term.value.bound, fv)))
        if (bound_in_scope)
            return term
        return obj('ECCArrow', {
            input: ecc_term_abbreviate(term.value.bound_type),
            output: ecc_term_abbreviate(term.value.scope)
        })
    } else if (cta('ECCSigma', term)) {
        const bound_in_scope = defined(ecc_free_variables(term.value.scope).value.find((fv) => ecc_terms_syntactically_equal(term.value.bound, fv)))
        if (bound_in_scope)
            return term
        return obj('ECCProduct', {
            left: ecc_term_abbreviate(term.value.bound_type),
            right: ecc_term_abbreviate(term.value.scope)
        })
    }
    return term
}

const ecc_shallow_term_abbreviate = (term: CoastlineObject<ECCTermOVM, ECCTerm>): CoastlineObject<ECCTermOVM, ECCTerm> => {
    if (cta('ECCPi', term)) {
        const scope_fvs = ecc_free_variables(term.value.scope)
        if (!ecc_term_appears_in_term_set(term.value.bound, scope_fvs))
            return obj('ECCArrow', {
                input: term.value.bound_type,
                output: term.value.scope
            })
        return term
    } else if (cta('ECCSigma', term)) {
        const scope_fvs = ecc_free_variables(term.value.scope)
        if (!ecc_term_appears_in_term_set(term.value.bound, scope_fvs))
            return obj('ECCProduct', { left: term.value.bound_type, right: term.value.scope })
        return term
    }
    return term
}

export const ecc_shallow_term_abbreviate_def = operator_definition<ECCTermOVM, ECCTermEVM>('abbreviate', ['term'], (inputs) =>
    expect_ecc_term(inputs[0], (term) => options_tree([
        // ['do not change', () => cta('') term],
        // ['to arrow type', () => expect_pi_term
        // ],
        // ['to product type', () =>
        //     cta('ECCPi', term) || cta('ECCSigma', term)
        //     ? obj('ECCProduct', { left: term.value.bound_type, right: term.value.scope })
        //     : err('WithMessage', 'You can only abbreviate Sigma types to Product types!')
        // ],
    ]))
)

const ecc_possibly_rename_bound_to_avoid_set = (bound: CoastlineObject<ECCTermOVM, 'ECCVariable'>, set: CoastlineObject<ECCTermOVM, 'ECCTermSet'>): CoastlineObject<ECCTermOVM, 'ECCVariable'> => {
    let current_bound = bound
    while (ecc_term_appears_in_term_set(current_bound, set))
        current_bound = obj('ECCVariable', `${current_bound.value}'`)
    return current_bound
}

export const ecc_possibly_rename_bound_to_avoid_set_def = operator_definition<ECCTermOVM, ECCTermEVM>('possibly_rename_bound_to_avoid_set', ['bound', 'set'], (inputs) =>
    expect_ecc_variable(inputs[0], (bound) => expect_ecc_term_set(inputs[1], (set) => options_tree([
        ['bound in set', () =>
            !ecc_term_appears_in_term_set(bound, set) ? err('WithMessage', 'No the given bound variables does not appear in the given set, so feel free to re-use bound.')
            : operator_app(ecc_possibly_rename_bound_to_avoid_set_def, [
                obj('ECCVariable', `${bound.value}'`),
                set
            ])
        ],
        ['bound not in set', () =>
            ecc_term_appears_in_term_set(bound, set) ? err('WithMessage', 'Yes the given bound variable does appear in the given set.')
            : bound
        ]
    ])))
)

const ecc_binder_capture_avoiding_substitution = (replace_v: CoastlineObject<ECCTermOVM, 'ECCVariable'>, with_t: CoastlineObject<ECCTermOVM, ECCTerm>, in_t: CoastlineObject<ECCTermOVM, 'ECCLambda' | 'ECCPi' | 'ECCSigma'>): CoastlineObject<ECCTermOVM, 'ECCLambda' | 'ECCPi' | 'ECCSigma'> => {
    const with_fvs = ecc_free_variables(with_t)
    const new_bound = ecc_possibly_rename_bound_to_avoid_set(in_t.value.bound, with_fvs)
    return obj(in_t.type, {
        bound: new_bound,
        bound_type: ecc_capture_avoiding_substitution(replace_v, with_t, in_t.value.bound_type),
        scope: ecc_capture_avoiding_substitution(
            replace_v,
            with_t,
            in_t.value.bound.value !== new_bound.value
            ? in_t.value.bound
            : ecc_capture_avoiding_substitution(in_t.value.bound, new_bound, in_t.value.scope)
        )
    })
}

const ecc_capture_avoiding_substitution = (replace_v: CoastlineObject<ECCTermOVM, 'ECCVariable'>, with_t: CoastlineObject<ECCTermOVM, ECCTerm>, in_t: CoastlineObject<ECCTermOVM, ECCTerm>): CoastlineObject<ECCTermOVM, ECCTerm> => {
    if (cta('ECCSD', in_t))
        throw new Error('Cannot currently perform capture-avoiding substitution with static distance!')
    if (cta('ECCVariable', in_t) && ecc_terms_syntactically_equal(replace_v, in_t))
        return with_t
    // Recursive cases without binders.
    if (cta('ECCApplication', in_t))
        return obj('ECCApplication', {
            head: ecc_capture_avoiding_substitution(replace_v, with_t, in_t.value.head),
            arg: ecc_capture_avoiding_substitution(replace_v, with_t, in_t.value.head)
        })
    if (cta('ECCArrow', in_t))
        return obj('ECCArrow', {
            input: ecc_capture_avoiding_substitution(replace_v, with_t, in_t.value.input),
            output: ecc_capture_avoiding_substitution(replace_v, with_t, in_t.value.output)
        })
    if (cta('ECCProduct', in_t))
        return obj('ECCProduct', {
            left: ecc_capture_avoiding_substitution(replace_v, with_t, in_t.value.left),
            right: ecc_capture_avoiding_substitution(replace_v, with_t, in_t.value.right)
        })
    if (cta('ECCProject', in_t))
        return obj('ECCProject', {
            project: in_t.value.project,
            pair: ecc_capture_avoiding_substitution(replace_v, with_t, in_t.value.pair)
        })
    if (cta('ECCPair', in_t))
        return obj('ECCPair', {
            pair_type: ecc_capture_avoiding_substitution(replace_v, with_t, in_t.value.pair_type),
            left: ecc_capture_avoiding_substitution(replace_v, with_t, in_t.value.left),
            right: ecc_capture_avoiding_substitution(replace_v, with_t, in_t.value.right)
        })
    // Recursive cases with binders.
    if (cta('ECCLambda', in_t) || cta('ECCPi', in_t) || cta('ECCSigma', in_t))
        return ecc_binder_capture_avoiding_substitution(replace_v, with_t, in_t)
    // No change
    return in_t
}

// (ECCVariable, ECCTerm, ECCTerm) => ECCTerm
export const ecc_capture_avoiding_substitution_def = operator_definition<ECCTermOVM, ECCTermEVM>('capture_avoiding_substitution', ['to_replace', 'replacement', 'in'], (inputs) =>
    expect_ecc_variable(inputs[0], (to_replace_v) => expect_ecc_term(inputs[1], (replacement_t) => expect_ecc_term(inputs[2], (in_t) =>
        options_tree([
            // no change: Prop, Type
            ['do not change', () =>
                ecc_term_appears_in_term_set(to_replace_v, ecc_free_variables(in_t)) && !ecc_terms_syntactically_equal(to_replace_v, replacement_t) ? err('WithMessage', 'The Term must change, because the Variable to replace exists in the Term you\'re substituting into')
                : in_t
            ],
            // replace current: Variable
            ['replace with replacement', () => expect_ecc_variable(in_t, (v) =>
                to_replace_v.value !== v.value ? err('WithMessage', 'Variable does not equal the Variable that is being replaced!')
                : replacement_t
            )],
            // simple recursive: Application, Arrow, Product, Pair, Projection
            ['in application', () => expect_ecc_application(in_t, (app) =>
                operator_app(application_def, [
                    operator_app(ecc_capture_avoiding_substitution_def, [to_replace_v, replacement_t, app.value.head]),
                    operator_app(ecc_capture_avoiding_substitution_def, [to_replace_v, replacement_t, app.value.arg])
                ])
            )],
            ['in arrow', () => expect_ecc_arrow(in_t, (arrow) =>
                operator_app(arrow_def, [
                    operator_app(ecc_capture_avoiding_substitution_def, [to_replace_v, replacement_t, arrow.value.input]),
                    operator_app(ecc_capture_avoiding_substitution_def, [to_replace_v, replacement_t, arrow.value.output])
                ])
            )],
            ['in product', () => expect_ecc_product(in_t, (product) =>
                operator_app(product_def, [
                    operator_app(ecc_capture_avoiding_substitution_def, [to_replace_v, replacement_t, product.value.left]),
                    operator_app(ecc_capture_avoiding_substitution_def, [to_replace_v, replacement_t, product.value.right])
                ])
            )],
            ['in pair', () => expect_ecc_pair(in_t, (pair) =>
                operator_app(pair_def, [
                    operator_app(ecc_capture_avoiding_substitution_def, [to_replace_v, replacement_t, pair.value.pair_type]),
                    operator_app(ecc_capture_avoiding_substitution_def, [to_replace_v, replacement_t, pair.value.left]),
                    operator_app(ecc_capture_avoiding_substitution_def, [to_replace_v, replacement_t, pair.value.right])
                ])
            )],
            ['in left projection', () => expect_ecc_projection(in_t, (projection) =>
                projection.value.project !== 'left' ? err('WithMessage', 'Projection is not a Left Projection!')
                : operator_app(left_projection_def, [
                    operator_app(ecc_capture_avoiding_substitution_def, [to_replace_v, replacement_t, projection.value.pair])
                ])
            )],
            ['in right projection', () => expect_ecc_projection(in_t, (projection) =>
                projection.value.project !== 'right' ? err('WithMessage', 'Projection is not a Right Projection!')
                : operator_app(right_projection_def, [
                    operator_app(ecc_capture_avoiding_substitution_def, [to_replace_v, replacement_t, projection.value.pair])
                ])
            )],
            // binding recursive: Lambda, Pi, Sigma
            ['in lambda', () => expect_ecc_lambda(in_t, (lambda) =>
                operator_app(ecc_capture_avoiding_substitution_with_new_bound_variable_in_lambda_def, [
                    // operator_app(ecc_check_variable_not_in_set_def, [
                    //     operator_app(variable_def, [
                    //         req2('String'),
                    //     ]),
                    //     operator_app(ecc_free_variables_def, [replacement_t])
                    // ]),
                    operator_app(ecc_possibly_rename_bound_to_avoid_set_def, [
                        lambda.value.bound,
                        operator_app(ecc_free_variables_def, [replacement_t])
                    ]),
                    to_replace_v,
                    replacement_t,
                    lambda
                ])
            )],
            ['in pi', () => expect_ecc_pi(in_t, (lambda) =>
                operator_app(ecc_capture_avoiding_substitution_with_new_bound_variable_in_pi_def, [
                    operator_app(ecc_possibly_rename_bound_to_avoid_set_def, [
                        lambda.value.bound,
                        operator_app(ecc_free_variables_def, [replacement_t])
                    ]),
                    to_replace_v,
                    replacement_t,
                    lambda
                ])
            )],
            ['in sigma', () => expect_ecc_sigma(in_t, (lambda) =>
                operator_app(ecc_capture_avoiding_substitution_with_new_bound_variable_in_sigma_def, [
                    operator_app(ecc_possibly_rename_bound_to_avoid_set_def, [
                        lambda.value.bound,
                        operator_app(ecc_free_variables_def, [replacement_t])
                    ]),
                    to_replace_v,
                    replacement_t,
                    lambda
                ])
            )]
        ])
    )))
)

export const ecc_check_variable_not_in_set_def = operator_definition<ECCTermOVM, ECCTermEVM>('check_variable_not_in_set', ['variable', 'set'], (inputs) =>
    expect_ecc_variable(inputs[0], (variable) => expect_ecc_term_set(inputs[1], (set) =>
        ecc_term_appears_in_term_set(variable, set) ? err('WithMessage', 'The given Variable appears in a given Set.  Try again.')
        : variable
    ))
)

export const ecc_capture_avoiding_substitution_with_new_bound_variable_in_lambda_def = operator_definition<ECCTermOVM, ECCTermEVM>('capture_avoiding_substitution_with_new_bound_variable_in_lambda', ['new_variable', 'to_replace', 'replacement', 'in'], (inputs) =>
    expect_ecc_variable(inputs[0], (new_variable) => expect_ecc_variable(inputs[1], (to_replace_v) => expect_ecc_term(inputs[2], (replacement_t) => expect_ecc_lambda(inputs[3], (lambda) =>
        operator_app(lambda_def, [
            new_variable,
            operator_app(ecc_capture_avoiding_substitution_def, [to_replace_v, replacement_t, lambda.value.bound_type]),
            operator_app(ecc_capture_avoiding_substitution_def, [
                to_replace_v,
                replacement_t,
                operator_app(ecc_capture_avoiding_substitution_def, [lambda.value.bound, new_variable, lambda.value.scope])
            ])
        ])
    ))))
)

export const ecc_capture_avoiding_substitution_with_new_bound_variable_in_pi_def = operator_definition<ECCTermOVM, ECCTermEVM>('capture_avoiding_substitution_with_new_bound_variable_in_pi', ['new_variable', 'to_replace', 'replacement', 'in'], (inputs) =>
    expect_ecc_variable(inputs[0], (new_variable) => expect_ecc_variable(inputs[1], (to_replace_v) => expect_ecc_term(inputs[2], (replacement_t) => expect_ecc_pi(inputs[3], (pi) =>
        operator_app(pi_def, [
            new_variable,
            operator_app(ecc_capture_avoiding_substitution_def, [to_replace_v, replacement_t, pi.value.bound_type]),
            operator_app(ecc_capture_avoiding_substitution_def, [
                to_replace_v,
                replacement_t,
                operator_app(ecc_capture_avoiding_substitution_def, [pi.value.bound, new_variable, pi.value.scope])
            ])
        ])
    ))))
)

export const ecc_capture_avoiding_substitution_with_new_bound_variable_in_sigma_def = operator_definition<ECCTermOVM, ECCTermEVM>('capture_avoiding_substitution_with_new_bound_variable_in_pi', ['new_variable', 'to_replace', 'replacement', 'in'], (inputs) =>
    expect_ecc_variable(inputs[0], (new_variable) => expect_ecc_variable(inputs[1], (to_replace_v) => expect_ecc_term(inputs[2], (replacement_t) => expect_ecc_sigma(inputs[3], (sigma) =>
        operator_app(pi_def, [
            new_variable,
            operator_app(ecc_capture_avoiding_substitution_def, [to_replace_v, replacement_t, sigma.value.bound_type]),
            operator_app(ecc_capture_avoiding_substitution_def, [
                to_replace_v,
                replacement_t,
                operator_app(ecc_capture_avoiding_substitution_def, [sigma.value.bound, new_variable, sigma.value.scope])
            ])
        ])
    ))))
)

export const ecc_and_def = operator_definition<ECCTermOVM, ECCTermEVM>('and', ['b1', 'b2'], (inputs: AnyCoastlineObject<ECCTermOVM>[]) =>
    expect_ecc_boolean(inputs[0], (b1) => expect_ecc_boolean(inputs[1], (b2) =>
        obj('Boolean', b1.value && b2.value)
    ))
)

// (ECCTerm, ECCTerm) => Boolean
export const ecc_terms_equal_def = operator_definition<ECCTermOVM, ECCTermEVM>('terms_equal', ['term1', 'term2'], (inputs) =>
    expect_ecc_term(inputs[0], (term1) => expect_ecc_term(inputs[1], (term2) =>
        options_tree([
            ['different types of ECCTerms', () => term1.type === term2.type ? err('WithMessage', 'You sure they have different types?') : obj('Boolean', false)],
            ['both Prop', () => expect_ecc_prop(term1, () => expect_ecc_prop(term2, () => obj('Boolean', true)))],
            ['both Type', () => expect_ecc_type(term1, (tu1) => expect_ecc_type(term2, (tu2) =>
                options_tree([
                    ['orders are the same', () => tu1.value !== tu2.value ? err('WithMessage', 'The orders are not the same.  Try again.') : obj('Boolean', true)],
                    ['orders are not the same', () => tu1.value === tu2.value ? err('WithMessage', 'The orders are the same.  Try again.') : obj('Boolean', false)]
                ])
            ))],
            ['both Variable', () => expect_ecc_variable(term1, (v1) => expect_ecc_variable(term2, (v2) =>
                options_tree([
                    ['ids are the same', () => v1.value !== v2.value ? err('WithMessage', 'The ids are not the same.  Try again.') : obj('Boolean', true)],
                    ['ids are not the same', () => v1.value === v2.value ? err('WithMessage', 'The ids are the same.  Try again.') : obj('Boolean', false)]
                ])
            ))],
            ['both Static Distances', () => expect_ecc_sd(term1, (sd1) => expect_ecc_sd(term2, (sd2) =>
                options_tree([
                    ['indices are the same', () => sd1.value !== sd2.value ? err('WithMessage', 'The ids are not the same.  Try again.') : obj('Boolean', true)],
                    ['indices are not the same', () => sd1.value === sd2.value ? err('WithMessage', 'The ids are the same.  Try again.') : obj('Boolean', false)]
                ])
            ))],
            ['both Application', () => expect_ecc_application(term1, (a1) => expect_ecc_application(term2, (a2) =>
                operator_app(ecc_and_def, [
                    operator_app(ecc_terms_equal_def, [a1.value.head, a2.value.head]),
                    operator_app(ecc_terms_equal_def, [a1.value.arg, a2.value.arg])
                ])
            ))],
            ['Both Arrow', () => expect_ecc_arrow(term1, (a1) => expect_ecc_arrow(term2, (a2) =>
                operator_app(ecc_and_def, [
                    operator_app(ecc_terms_equal_def, [a1.value.input, a2.value.input]),
                    operator_app(ecc_terms_equal_def, [a1.value.output, a2.value.output])
                ])
            ))],
            ['Both Product', () => expect_ecc_product(term1, (p1) => expect_ecc_product(term2, (p2) =>
                operator_app(ecc_and_def, [
                    operator_app(ecc_terms_equal_def, [p1.value.left, p2.value.left]),
                    operator_app(ecc_terms_equal_def, [p1.value.right, p2.value.right])
                ])
            ))],
            ['both Pair', () => expect_ecc_pair(term1, (p1) => expect_ecc_pair(term2, (p2) =>
                operator_app(ecc_and_def, [
                    operator_app(ecc_terms_equal_def, [p1.value.pair_type, p2.value.pair_type]),
                    operator_app(ecc_and_def, [
                        operator_app(ecc_terms_equal_def, [p1.value.left, p2.value.left]),
                        operator_app(ecc_terms_equal_def, [p1.value.right, p2.value.right])
                    ])
                ])
            ))],
            ['both Left Projection', () => expect_ecc_projection(term1, (lp1) => expect_ecc_projection(term2, (lp2) =>
                lp1.value.project !== 'left' || lp2.value.project !== 'left' ? err('WithMessage', 'One of the two term\'s is not a left projection!')
                : operator_app(ecc_terms_equal_def, [lp1.value.pair, lp2.value.pair])
            ))],
            ['both Right Projection', () => expect_ecc_projection(term1, (lp1) => expect_ecc_projection(term2, (lp2) =>
                lp1.value.project !== 'right' || lp2.value.project !== 'right' ? err('WithMessage', 'One of the two term\'s is not a left projection!')
                : operator_app(ecc_terms_equal_def, [lp1.value.pair, lp2.value.pair])
            ))],
            ['Both Lambda', () => expect_ecc_lambda(term1, (l1) => expect_ecc_lambda(term2, (l2) =>
                operator_app(ecc_and_def, [
                    operator_app(ecc_terms_equal_def, [l1.value.bound, l2.value.bound]),
                    operator_app(ecc_terms_equal_def, [l1.value.bound_type, l2.value.bound_type]),
                    operator_app(ecc_terms_equal_def, [l1.value.scope, l2.value.scope])
                ])
            ))],
            ['Both Pi', () => expect_ecc_pi(term1, (p1) => expect_ecc_pi(term2, (p2) =>
                operator_app(ecc_and_def, [
                    operator_app(ecc_terms_equal_def, [p1.value.bound, p2.value.bound]),
                    operator_app(ecc_terms_equal_def, [p1.value.bound_type, p2.value.bound_type]),
                    operator_app(ecc_terms_equal_def, [p1.value.scope, p2.value.scope])
                ])
            ))],
            ['Both Sigma', () => expect_ecc_sigma(term1, (s1) => expect_ecc_sigma(term2, (s2) =>
                operator_app(ecc_and_def, [
                    operator_app(ecc_terms_equal_def, [s1.value.bound, s2.value.bound]),
                    operator_app(ecc_terms_equal_def, [s1.value.bound_type, s2.value.bound_type]),
                    operator_app(ecc_terms_equal_def, [s1.value.scope, s2.value.scope])
                ])
            ))]
        ])
    ))
)

const ecc_terms_alpha_equal = (term1: CoastlineObject<ECCTermOVM, ECCTerm>, term2: CoastlineObject<ECCTermOVM, ECCTerm>): boolean => {
    return ecc_terms_syntactically_equal(
        ecc_static_distance(term1),
        ecc_static_distance(term2))
}

// (ECCTerm, ECCTerm) => Boolean
export const ecc_terms_alpha_equal_def = operator_definition<ECCTermOVM, ECCTermEVM>('alpha_equals', ['term1', 'term2'], (inputs) =>
    expect_ecc_term(inputs[0], (term1) => expect_ecc_term(inputs[1], (term2) =>
        operator_app(ecc_terms_equal_def, [
            operator_app(ecc_static_distance_def, [obj('ECCSDContext', []), term1]),
            operator_app(ecc_static_distance_def, [obj('ECCSDContext', []), term2])
        ])
    ))
)

const ecc_static_distance = (term: CoastlineObject<ECCTermOVM, ECCTerm>): CoastlineObject<ECCTermOVM, ECCTerm> => {
    const static_distance_acc = (acc: CoastlineObject<ECCTermOVM, 'ECCVariable'>[], term: CoastlineObject<ECCTermOVM, ECCTerm>): CoastlineObject<ECCTermOVM, ECCTerm> => {
        if (cta('ECCVariable', term)) {
            const v_index = acc.findIndex((v) => term.value === v.value)
            if (v_index === -1)
                return term
            return obj('ECCSD', v_index)
        }
        if (cta('ECCArrow', term))
            return obj('ECCArrow', {
                input: static_distance_acc(acc, term.value.input),
                output: static_distance_acc(acc, term.value.output)
            })
        if (cta('ECCProduct', term))
            return obj('ECCProduct', {
                left: static_distance_acc(acc, term.value.left),
                right: static_distance_acc(acc, term.value.right)
            })
        if (cta('ECCPair', term))
            return obj('ECCPair', {
                pair_type: static_distance_acc(acc, term.value.pair_type),
                left: static_distance_acc(acc, term.value.left),
                right: static_distance_acc(acc, term.value.right)
            })
        if (cta('ECCProject', term))
            return obj('ECCProject', {
                project: term.value.project,
                pair: static_distance_acc(acc, term.value.pair)
            })
        if (cta('ECCApplication', term))
            return obj('ECCApplication', {
                head: static_distance_acc(acc, term.value.head),
                arg: static_distance_acc(acc, term.value.arg)
            })
        if (ctas(['ECCLambda', 'ECCPi', 'ECCSigma'], term)) {
            const scope_acc = [term.value.bound, ...acc]
            return obj(term.type, {
                bound: obj('ECCVariable', ''),
                bound_type: static_distance_acc(acc, term.value.bound_type),
                scope: static_distance_acc(scope_acc, term)
            })
        }
        return term
    }
    return static_distance_acc([], term)
}

const js_ecc_binders_alpha_equal = (term1: CoastlineObject<ECCTermOVM, ECCBinder>, term2: CoastlineObject<ECCTermOVM, ECCBinder>): CoastlineControl<ECCTermOVM, ECCTermEVM> =>
    operator_app(ecc_and_def, [
        operator_app(ecc_terms_alpha_equal_def, [term1.value.bound_type, term2.value.bound_type]),
        operator_app(ecc_terms_alpha_equal_def, [
            term1.value.scope,
            operator_app(ecc_capture_avoiding_substitution_def, [
                term2.value.bound,
                term1.value.bound,
                term2.value.scope
            ])
        ])
    ])

export const expect_ecc_sd_context = expect_type<ECCTermOVM, ECCTermEVM, 'ECCSDContext'>('ECCSDContext')

// (ECCSDContext, Natural_Number, ECCTerm) => ECCSD
export const ecc_static_distance_of_variable_def = operator_definition<ECCTermOVM, ECCTermEVM>('static_distance_of_variable', ['distance_context', 'current_distance', 'variable'], (inputs) =>
    expect_ecc_sd_context(inputs[0], (sd_ctx) => expect_ecc_natural(inputs[1], (current_sd) => expect_ecc_term(inputs[2], (variable) =>
        options_tree([
            ['variable is free', () =>
                defined(sd_ctx.value.find((v) => ecc_terms_syntactically_equal(v, variable)))
                ? err('WithMessage', 'The Variable is not free as it occurs in the distance context.  Keep looking.')
                : variable
            ],
            ['found variable', () =>
                sd_ctx.value.length === 0 ? err('WithMessage', 'The Variable could not have been found in an empty cistance context.')
                : first(sd_ctx.value).value !== variable.value ? err('WithMessage', 'Keep searching for the Variable in the distance context.')
                : obj('ECCSD', current_sd.value)
            ],
            ['keep looking for variable', () =>
                sd_ctx.value.length === 0 ? err('WithMessage', 'Cannot keep searching through an empty distance context!')
                : first(sd_ctx.value).value === variable.value ? err('WithMessage', 'Try again.')
                : operator_app(ecc_static_distance_of_variable_def, [obj('ECCSDContext', rest(sd_ctx.value)), obj('Natural_Number', current_sd.value + 1), variable])
            ]
        ])
    )))
)

// (ECCSDContext, ECCTerm) => ECCTerm
export const ecc_static_distance_def = operator_definition<ECCTermOVM, ECCTermEVM>('static_distance', ['distance_context', 'term'], (inputs) =>
    expect_ecc_sd_context(inputs[0], (sd_ctx) => expect_ecc_term(inputs[1], (term) => options_tree([
        ['do not change', () => expect_types<ECCTermOVM, ECCTermEVM, 'ECCProp' | 'ECCType' | 'ECCVariable'>('ECCProp', 'ECCType', 'ECCVariable')(term, () =>
            cta('ECCVariable', term) && defined(sd_ctx.value.find((v) => term.value === v.value))
            ? err('WithMessage', 'The variable is in the distance context, so it should change.')
            : term
        )],
        ['replace with static distance', () => expect_ecc_variable(term, (v) =>
            operator_app(ecc_static_distance_of_variable_def, [sd_ctx, obj('Natural_Number', 0), v])
        )],
        ['Application', () => expect_ecc_application(term, (a) =>
            operator_app(application_def, [
                operator_app(ecc_static_distance_def, [sd_ctx, a.value.head]),
                operator_app(ecc_static_distance_def, [sd_ctx, a.value.arg])
            ])
        )],
        ['Arrow', () => expect_ecc_arrow(term, (a) =>
            operator_app(arrow_def, [
                operator_app(ecc_static_distance_def, [sd_ctx, a.value.input]),
                operator_app(ecc_static_distance_def, [sd_ctx, a.value.output])
            ])
        )],
        ['Product', () => expect_ecc_product(term, (p) =>
            operator_app(product_def, [
                operator_app(ecc_static_distance_def, [sd_ctx, p.value.left]),
                operator_app(ecc_static_distance_def, [sd_ctx, p.value.right])
            ])
        )],
        ['Pair', () => expect_ecc_pair(term, (p) =>
            operator_app(pair_def, [
                operator_app(ecc_static_distance_def, [sd_ctx, p.value.pair_type]),
                operator_app(ecc_static_distance_def, [sd_ctx, p.value.left]),
                operator_app(ecc_static_distance_def, [sd_ctx, p.value.right])
            ])
        )],
        ['Left Projection', () => expect_ecc_projection(term, (lp) =>
            lp.value.project !== 'left' ? err('WithMessage', 'The ECCTerm is not a left projection!')
            : operator_app(left_projection_def, [sd_ctx, lp.value.pair])
        )],
        ['Right Projection', () => expect_ecc_projection(term, (rp) =>
            rp.value.project !== 'right' ? err('WithMessage', 'The ECCTerm is not a right projection!')
            : operator_app(left_projection_def, [sd_ctx, rp.value.pair])
        )],
        ['Lambda', () => expect_ecc_lambda(term, (l) =>
            operator_app(lambda_def, [
                obj('ECCVariable', ''),
                operator_app(ecc_static_distance_def, [sd_ctx, l.value.bound_type]),
                operator_app(ecc_static_distance_def, [obj('ECCSDContext', [l.value.bound, ...sd_ctx.value]), l.value.scope])
            ])
        )],
        ['Pi', () => expect_ecc_pi(term, (l) =>
            operator_app(pi_def, [
                obj('ECCVariable', ''),
                operator_app(ecc_static_distance_def, [sd_ctx, l.value.bound_type]),
                operator_app(ecc_static_distance_def, [obj('ECCSDContext', [l.value.bound, ...sd_ctx.value]), l.value.scope])
            ])
        )],
        ['Sigma', () => expect_ecc_sigma(term, (l) =>
            operator_app(sigma_def, [
                obj('ECCVariable', ''),
                operator_app(ecc_static_distance_def, [sd_ctx, l.value.bound_type]),
                operator_app(ecc_static_distance_def, [obj('ECCSDContext', [l.value.bound, ...sd_ctx.value]), l.value.scope])
            ])
        )]
    ])))
)

const ecc_is_beta_redex = (t: CoastlineObject<ECCTermOVM, ECCTerm>): boolean =>
    cta('ECCApplication', t) && cta('ECCLambda', t.value.head)

const ecc_is_left_sigma_redex = (t: CoastlineObject<ECCTermOVM, ECCTerm>): boolean =>
    cta('ECCProject', t) && t.value.project === 'left' && cta('ECCPair', t.value.pair)

const ecc_is_right_sigma_redex = (t: CoastlineObject<ECCTermOVM, ECCTerm>): boolean =>
    cta('ECCProject', t) && t.value.project === 'left' && cta('ECCPair', t.value.pair)

const ecc_term_children = (t: CoastlineObject<ECCTermOVM, ECCTerm>): CoastlineObject<ECCTermOVM, ECCTerm>[] => {
    if (cta('ECCApplication', t))
        return [t.value.head, t.value.arg]
    if (cta('ECCArrow', t))
        return [t.value.input, t.value.output]
    if (cta('ECCProduct', t))
        return [t.value.left, t.value.right]
    if (cta('ECCPair', t))
        return [t.value.pair_type, t.value.left, t.value.right]
    if (cta('ECCProject', t))
        return [t.value.pair]
    if (cta('ECCLambda', t) || cta('ECCPi', t) || cta('ECCSigma', t))
        return [t.value.bound_type, t.value.scope]
    return []
}

const ecc_term_is_in_beta_sigma_normal_form = (t: CoastlineObject<ECCTermOVM, ECCTerm>): boolean =>
    !ecc_is_beta_redex(t) && !ecc_is_left_sigma_redex(t) && !ecc_is_right_sigma_redex(t)
    && ecc_term_children(t).every(ecc_term_is_in_beta_sigma_normal_form)

const ecc_reduce_completely = (term: CoastlineObject<ECCTermOVM, ECCTerm>): CoastlineObject<ECCTermOVM, ECCTerm> => {
    if (cta('ECCApplication', term)) {
        const reduced_head = ecc_reduce_completely(term.value.head)
        // If beta redex
        if (cta('ECCLambda', reduced_head))
            return ecc_reduce_completely(
                ecc_capture_avoiding_substitution(
                    reduced_head.value.bound,
                    ecc_reduce_completely(term.value.arg),
                    reduced_head.value.scope))
        return obj('ECCApplication', {
            head: ecc_reduce_completely(term.value.head),
            arg: ecc_reduce_completely(term.value.arg)
        })
    } else if (cta('ECCProject', term)) {
        // If sigma redex
        if (cta('ECCPair', term.value.pair))
            if (term.value.project === 'left')
                return ecc_reduce_completely(term.value.pair.value.left)
            else
                return ecc_reduce_completely(term.value.pair.value.right)
        return obj('ECCProject', {
            project: term.value.project,
            pair: ecc_reduce_completely(term.value.pair)
        })
    } else if (cta('ECCArrow', term))
        return obj('ECCArrow', {
            input: ecc_reduce_completely(term.value.input),
            output: ecc_reduce_completely(term.value.output)
        })
    else if (cta('ECCProduct', term))
        return obj('ECCProduct', {
            left: ecc_reduce_completely(term.value.left),
            right: ecc_reduce_completely(term.value.right)
        })
    else if (cta('ECCLambda', term))
        return obj('ECCLambda', {
            bound: term.value.bound,
            bound_type: ecc_reduce_completely(term.value.bound_type),
            scope: ecc_reduce_completely(term.value.scope)
        })
    else if (cta('ECCPi', term))
        return obj('ECCPi', {
            bound: term.value.bound,
            bound_type: ecc_reduce_completely(term.value.bound_type),
            scope: ecc_reduce_completely(term.value.scope)
        })
    else if (cta('ECCSigma', term))
        return obj('ECCSigma', {
            bound: term.value.bound,
            bound_type: ecc_reduce_completely(term.value.bound_type),
            scope: ecc_reduce_completely(term.value.scope)
        })
    return term
}

// (ECCTerm) => ECCTerm
export const ecc_reduce_completely_def = operator_definition<ECCTermOVM, ECCTermEVM>('reduce_completely', ['term'], (inputs) =>
    expect_ecc_term(inputs[0], (term) =>
        options_tree([
            ['already reduced', () => !ecc_term_is_in_beta_sigma_normal_form(term) ? err('WithMessage', 'It\'s not.') : term],
            ['is β-redex', () => expect_ecc_application(term, (app) => expect_ecc_lambda(app.value.head, (lam) =>
                operator_app(ecc_reduce_completely_def, [
                    operator_app(ecc_capture_avoiding_substitution_def, [
                        lam.value.bound,
                        operator_app(ecc_reduce_completely_def, [app.value.arg]),
                        lam.value.scope
                    ])
                ])
            ))],
            ['is left σ-redex', () => expect_ecc_projection(term, (pr) => expect_ecc_pair(pr.value.pair, (pa) =>
                pr.value.project !== 'left' ? err('WithMessage', 'This is a right projection.')
                : operator_app(ecc_reduce_completely_def, [pa.value.left])
            ))],
            ['is right σ-redex', () => expect_ecc_projection(term, (pr) => expect_ecc_pair(pr.value.pair, (pa) =>
                pr.value.project !== 'right' ? err('WithMessage', 'This is a left projection.')
                : operator_app(ecc_reduce_completely_def, [pa.value.right])
            ))],
            ['Application', () => expect_ecc_application(term, (a) =>
                ecc_is_beta_redex(a) ? err('WithMessage', 'But this is a redex!')
                : operator_app(application_def, [
                    operator_app(ecc_reduce_completely_def, [a.value.head]),
                    operator_app(ecc_reduce_completely_def, [a.value.arg])
                ])
            )],
            ['Arrow', () => expect_ecc_arrow(term, (a) =>
                operator_app(arrow_def, [
                    operator_app(ecc_reduce_completely_def, [a.value.input]),
                    operator_app(ecc_reduce_completely_def, [a.value.output])
                ])
            )],
            ['Product', () => expect_ecc_product(term, (p) =>
                operator_app(product_def, [
                    operator_app(ecc_reduce_completely_def, [p.value.left]),
                    operator_app(ecc_reduce_completely_def, [p.value.right])
                ])
            )],
            ['Pair', () => expect_ecc_pair(term, (p) =>
                operator_app(pair_def, [
                    operator_app(ecc_reduce_completely_def, [p.value.pair_type]),
                    operator_app(ecc_reduce_completely_def, [p.value.left]),
                    operator_app(ecc_reduce_completely_def, [p.value.right]),
                ])
            )],
            ['Left Projection', () => expect_ecc_projection(term, (lp) =>
                ecc_is_left_sigma_redex(lp) ? err('WithMessage', 'But this is a redex!')
                : lp.value.project !== 'left' ? err('WithMessage', 'The ECCTerm is not a left projection!')
                : operator_app(left_projection_def, [
                    operator_app(ecc_reduce_completely_def, [lp.value.pair])
                ])
            )],
            ['Right Projection', () => expect_ecc_projection(term, (rp) =>
                ecc_is_right_sigma_redex(rp) ? err('WithMessage', 'But this is a redex!')
                : rp.value.project !== 'right' ? err('WithMessage', 'The ECCTerm is not a right projection!')
                : operator_app(right_projection_def, [
                    operator_app(ecc_reduce_completely_def, [rp.value.pair])
                ])
            )],
            ['Lambda', () => expect_ecc_lambda(term, (l) =>
                operator_app(lambda_def, [
                    l.value.bound,
                    operator_app(ecc_reduce_completely_def, [l.value.bound_type]),
                    operator_app(ecc_reduce_completely_def, [l.value.scope])
                ])
            )],
            ['Pi', () => expect_ecc_pi(term, (l) =>
                operator_app(pi_def, [
                    l.value.bound,
                    operator_app(ecc_reduce_completely_def, [l.value.bound_type]),
                    operator_app(ecc_reduce_completely_def, [l.value.scope])
                ])
            )],
            ['Sigma', () => expect_ecc_sigma(term, (l) =>
                operator_app(sigma_def, [
                    l.value.bound,
                    operator_app(ecc_reduce_completely_def, [l.value.bound_type]),
                    operator_app(ecc_reduce_completely_def, [l.value.scope])
                ])
            )]
        ])
    )
)

const ecc_terms_beta_equal = (term1: CoastlineObject<ECCTermOVM, ECCTerm>, term2: CoastlineObject<ECCTermOVM, ECCTerm>): boolean => {
    return ecc_terms_alpha_equal(
        ecc_reduce_completely(term1),
        ecc_reduce_completely(term2)
    )
}

// (ECCTerm, ECCTerm) => boolean
export const ecc_beta_equality_def = operator_definition<ECCTermOVM, ECCTermEVM>('beta_equality', ['term1', 'term2'], (inputs) =>
    expect_ecc_term(inputs[0], (term1) => expect_ecc_term(inputs[1], (term2) =>
        operator_app(ecc_terms_alpha_equal_def, [
            operator_app(ecc_reduce_completely_def, [term1]),
            operator_app(ecc_reduce_completely_def, [term2])
        ])
    ))
)

const ecc_subtype_of = (term1: CoastlineObject<ECCTermOVM, ECCTerm>, term2: CoastlineObject<ECCTermOVM, ECCTerm>): boolean => {
    return ecc_terms_beta_equal(term1, term2)
}

// () => boolean
export const ecc_subtype_of_def = operator_definition<ECCTermOVM, ECCTermEVM>('subtype_of', ['term1', 'term2'], (inputs) =>
    expect_ecc_term(inputs[0], (term1) => expect_ecc_term(inputs[1], (term2) =>
        options_tree([
            // ['terms are equal', () => ctas(['ECCSigma', 'ECCPi', 'ECCProduct', 'ECCArrow', 'ECCType', 'ECCProp'], term1)
            //     ? err('There are other clauses you should try before selecting this one')
            //     : ],
            // ['']
        ])
    ))
)