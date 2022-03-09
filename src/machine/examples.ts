import { isEqual, union, unionWith } from "lodash"
import { declare, defined, first, is_string, rest, zip } from "../utilities"
import { CoastlineControl } from "./control"
import { err } from "./error"
import { AnyCoastlineObject, bin_tree_type, CoastlineObject, CoastlineObjectValueMap, cta, display_coastline_object, ECCBinder, ECCTerm, obj, object_constructor, Substitution, Term } from "./object"
import { OperatorDefinition, operator_app, operator_definition } from "./operator"
import { options_tree } from "./options_tree"
import { req2 } from "./request"
// import { req } from "./request"
import { expect_type, expect_types } from "./utilities"

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////// FIBONACCI /////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const expect_natural = expect_type('Natural_Number')
const nat = object_constructor('Natural_Number')

export const fib_def = operator_definition('fib', ['n'], (inputs) =>
    expect_natural(inputs[0], (n) =>
        options_tree([
            ['zero'  , () => n.value !== 0 ? err('InputNotEqualTo', 0) : obj('Natural_Number', 0)],
            ['one'   , () => n.value !== 1 ? err('InputNotEqualTo', 1) : obj('Natural_Number', 1)],
            ['ge_two', () => n.value   < 2 ? err('InputNotGreaterThanOrEqualTo', 2)
                : operator_app(plus_def, [
                    operator_app(fib_def, [obj('Natural_Number', n.value - 2)]),
                    operator_app(fib_def, [obj('Natural_Number', n.value - 1)])
                ])
            ]
        ])
    )
)

export const plus_def = operator_definition('plus', ['n1', 'n2'], (inputs) =>
    expect_natural(inputs[0], (n1) =>
        expect_natural(inputs[1], (n2) =>
            obj('Natural_Number', n1.value + n2.value)
        )
    )
)

export const max_def = operator_definition('max', ['n1', 'n2'], (inputs) => expect_natural(inputs[0], (n1) => expect_natural(inputs[1], (n2) => n1.value >= n2.value ? n1 : n2)))

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////// TERMS_EQUAL ////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const expect_term     = expect_types('TermAtom', 'TermVariable', 'TermList')
const expect_atom     = expect_type('TermAtom')
const expect_variable = expect_type('TermVariable')
const expect_boolean  = expect_type('Boolean')
const expect_list     = expect_type('TermList')

// (Term, Term) => Boolean
export const terms_equal_def = operator_definition('terms_equal', ['left', 'right'], (inputs) =>
    expect_term(inputs[0], (t1) => expect_term(inputs[1], (t2) =>
        options_tree([
            ['atoms',           () => operator_app(atoms_equal_def,     [t1, t2])],
            ['variables',       () => operator_app(variables_equal_def, [t1, t2])],
            ['lists',           () => operator_app(lists_equal_def,     [t1, t2])],
            ['different_types', () => obj('Boolean', false)]
        ])
    ))
)

// (TermAtom, TermAtom) => Boolean
export const atoms_equal_def = operator_definition('atoms_equal', ['left', 'right'], (inputs) =>
    expect_atom(inputs[0], (a1) => expect_atom(inputs[1], (a2) =>
        options_tree([
            ['atoms_are_equal',     () => a1.value !== a2.value ? err('TermsAreNotEqual', { term1: a1, term2: a2 }) : obj('Boolean', true)],
            ['atoms_are_not_equal', () => a1.value === a2.value ? err('TermsAreEqual',    { term1: a1, term2: a2 }) : obj('Boolean', false)]
        ])
    ))
)

// (TermVariable, TermVariable) => Boolean
export const variables_equal_def = operator_definition('variables_equal', ['left', 'right'], (inputs) =>
    expect_variable(inputs[0], (v1) => expect_variable(inputs[1], (v2) =>
        options_tree([
            ['atoms_are_equal',     () => v1.value !== v2.value ? err('TermsAreNotEqual',  { term1: v1, term2: v2 }) : obj('Boolean', true)],
            ['atoms_are_not_equal', () => v1.value === v2.value ? err('TermsAreEqual',     { term1: v1, term2: v2 }) : obj('Boolean', false)]
        ])
    ))
)

// (Boolean, Boolean) => Boolean
export const and_def = operator_definition('and', ['b1', 'b2'], (inputs: AnyCoastlineObject[]) =>
    expect_boolean(inputs[0], (b1) => expect_boolean(inputs[1], (b2) =>
        obj('Boolean', b1.value && b2.value)
    ))
)

// (TermList, TermList) => Boolean
export const lists_equal_def = operator_definition('lists_equal', ['left', 'right'], (inputs: AnyCoastlineObject[]) =>
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
const expect_sub           = expect_types('EmptySub', 'NonEmptySub')
const expect_empty_sub     = expect_type('EmptySub')
const expect_non_empty_sub = expect_type('NonEmptySub')

export const substitution_variables_appear_in_term = (s: CoastlineObject<'EmptySub' | 'NonEmptySub'>, t: CoastlineObject<Term>): boolean => {
    if (cta('EmptySub', s))
        return false
    if (cta('NonEmptySub', s))
        return js_occurs_check(s.value.variable, t) || substitution_variables_appear_in_term(s.value.rest, t)
    return false
}

// (Substitution, Term) => Term
export const apply_substitution_def_2 = operator_definition('apply_substitution', ['substitution', 'term'], (inputs) =>
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
export const apply_substitution_to_variable_def = operator_definition('apply_substitution_to_variable', ['substitution', 'variable'], (inputs) =>
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
export const apply_substitution_to_list_def_2 = operator_definition('apply_substitution_to_list_def_2', ['substitution', 'list'], (inputs) =>
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

// // (Substitution, Term) => Term
// export const apply_substitution_def = operator_definition('apply_substitution', (inputs) =>
//     expect_sub(inputs[0], (s) => expect_term(inputs[1], (t) =>
//         options_tree([
//             ['empty_sub',     () => expect_empty_sub    (s, () => t)],
//             ['non_empty_sub', () => expect_non_empty_sub(s, () => operator_app(apply_non_empty_sub_def, [s, t]))]
//         ])
//     ))
// )

// // (NonEmptySub, Term) => Term
// export const apply_non_empty_sub_def = operator_definition('apply_non_empty_substitution', (inputs) =>
//     expect_non_empty_sub(inputs[0], (s) => expect_term(inputs[1], (t) =>
//         options_tree([
//             ['atom',     () => expect_atom(t, () => t)],
//             ['variable', () => operator_app(sub_single_in_variable_def, [s.value.variable, s.value.term, t])],
//             ['list',     () => operator_app(apply_substitution_to_list_def, [s, t])]
//         ])
//     ))
// )

// // (TermVariable, Term, Variable) => Term
// export const sub_single_in_variable_def = operator_definition('sub_single_in_atom', (inputs) =>
//     expect_variable(inputs[0], (from_v) => expect_term(inputs[1], (to_t) => expect_variable(inputs[2], (in_v) =>
//         options_tree([
//             ['replace_variable',        () => from_v.value !== in_v.value ? err('TermsAreNotEqual', { term1: from_v, term2: in_v }) : to_t],
//             ['do_not_replace_variable', () => from_v.value === in_v.value ? err('TermsAreEqual',    { term1: from_v, term2: in_v }) : in_v]
//         ])
//     )))
// )

// // (Substitution, TermList) => TermList
// export const apply_substitution_to_list_def = operator_definition('apply_substitution_to_list_def', (inputs) =>
//     expect_sub(inputs[0], (s) => expect_list(inputs[1], (l) =>
//         options_tree([
//             ['list_is_empty',     () => l.value.length !== 0 ? err('ListIsNotEmpty', l) : l],
//             ['list_is_not_empty', () => l.value.length === 0 ? err('ListIsEmpty', l)
//                 : operator_app(cons_def, [
//                     operator_app(apply_substitution_def, [s, first(l.value)]),
//                     obj('TermList', rest(l.value))
//                 ])
//             ]
//         ])
//     ))
// )

// (Term, TermList) => TermList
export const cons_def = operator_definition('cons', ['head', 'tail'], (inputs) =>
    expect_term(inputs[0], (t) => expect_list(inputs[1], (l) =>
        obj('TermList', [t, ...l.value])
    ))
)

// (s1 o s2)(f) = s1(s2(f)),
// so we should append s1 to the end of s2, applying s1 to every term in s2.
// if there are conflicting variables, the one seen in 
export const compose_substitutions_def = operator_definition('compose_substitutions', ['s1', 's2'], (inputs) =>
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
export const cons_sub_def = operator_definition('cons_substitution', ['new_variable', 'new_term', 'old_substitution'], (inputs) =>
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

export const build_list_def = operator_definition('build_list', [], () =>
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
const expect_unification_problem = expect_type('UnificationProblem')
const expect_unification_equation = expect_type('UnificationEquation')

// (Term, Term) => Substitution
export const start_unification_def = operator_definition('start_unification', ['left', 'right'], (inputs) =>
    expect_term(inputs[0], (left) => expect_term(inputs[1], (right) =>
        operator_app(unify_def, [obj('EmptySub', []), obj('UnificationProblem', [obj('UnificationEquation', ({ left, right }))])])
    ))
)

const js_terms_equal = (l: CoastlineObject<Term>, r: CoastlineObject<Term>): boolean => {
    if (cta('TermList', l) && cta('TermList', r))
        return l.value.length === r.value.length && zip(l.value, r.value).every(([lt, rt]) => js_terms_equal(lt, rt))
    return l.type === r.type && l.value === r.value
}

const js_occurs_check = (lv: CoastlineObject<'TermVariable'>, r: CoastlineObject<Term>): boolean => {
    return (cta('TermVariable', r) && lv.value === r.value)
        || (cta('TermList', r) && r.value.some((t) => js_occurs_check(lv, t)))
}

const js_conflicts = (l: CoastlineObject<Term>, r: CoastlineObject<Term>): boolean =>
    (cta('TermAtom', l) && cta('TermAtom', r) && l.value !== r.value)
    || (cta('TermList', l) && cta('TermList', r) && l.value.length !== r.value.length)

// (Substitution, UnificationProblem, UnificationEquation) => Substitution | UnificationError
export const unify_def = operator_definition('unify', ['substitution', 'problem'], (inputs) =>
    expect_sub(inputs[0], (sub) => expect_unification_problem(inputs[1], (problem) =>
        problem.value.length === 0 ? sub
        : declare(first(problem.value), ({ value: { left: l, right: r } }) => options_tree([
            ['delete', () => !js_terms_equal(l, r) ? err('TermsAreNotEqual', { term1: l, term2: r }) : operator_app(unify_def, [sub, obj('UnificationProblem', rest(problem.value))])],
            ['decompose', () => expect_list(l, (ll) => expect_list(r, (rl) => skipped_decompose(sub, obj('UnificationProblem', rest(problem.value)), ll, rl)))],
            ['conflict', () => !js_conflicts(l, r) ? err('WithMessage', 'Terms do not conflict!') : obj('UnificationError', undefined)],
            ['swap', () => !cta('TermVariable', l) && !cta('TermVariable', r) ? err('CannotSwapError', undefined) : operator_app(unify_def, [sub, obj('UnificationProblem', [obj('UnificationEquation', { left: r, right: l }), ...rest(problem.value)])])],
            ['eliminate', () => expect_variable(l, (lv) => js_occurs_check(lv, r) ? err('VariableOccursInTerm', { variable: lv, term: r }) : skipped_eliminate(sub, obj('UnificationProblem', rest(problem.value)), lv, r))],
            ['check', () => expect_variable(l, (lv) =>
                !js_occurs_check(lv, r)
                    ? err('VariableDoesNotOccurInTerm', { variable: lv, term: r })
                    : js_terms_equal(l, r) ? err('WithMessage', 'Occurs check cannot be run when two terms are equal!')
                    : obj('UnificationError', undefined))]
        ]))
    ))
)

const skipping_check_unify_finished = (sub: CoastlineObject<Substitution>, problem: CoastlineObject<'UnificationProblem'>): CoastlineControl => {
    if (problem.value.length === 0)
        return sub
    return operator_app(unify_def, [sub, obj('UnificationProblem', rest(problem.value)), obj('UnificationEquation', ({ left: first(problem.value).value.left, right: first(problem.value).value.right }))])
}

// (Substitution, UnificationProblem) => Substitution
export const check_unify_finished_def = operator_definition('check_unify_finished', ['substitution', 'problem'], (inputs) =>
    expect_sub(inputs[0], (sub) => expect_unification_problem(inputs[1], (ues) =>
        ues.value.length === 0 ? sub
        : operator_app(unify_def, [
            sub,
            obj('UnificationProblem', rest(ues.value)),
            obj('UnificationEquation', ({ left: first(ues.value).value.left, right: first(ues.value).value.right }))
        ])
    ))
)

const skipped_decompose = (sub: CoastlineObject<Substitution>, problem: CoastlineObject<'UnificationProblem'>, l: CoastlineObject<'TermList'>, r: CoastlineObject<'TermList'>): CoastlineControl => {
    if (l.value.length !== r.value.length)
        return err('ListsHaveDifferentLengths', { list1: l, list2: r })
    const new_ues_array = zip(l.value, r.value).map(([lt, rt]) => (obj('UnificationEquation', { left: lt, right: rt })))
    const mod_ues = obj('UnificationProblem', [...new_ues_array, ...problem.value])
    return operator_app(unify_def, [sub, mod_ues])
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

const skipped_eliminate = (sub: CoastlineObject<Substitution>, problem: CoastlineObject<'UnificationProblem'>, variable: CoastlineObject<'TermVariable'>, term: CoastlineObject<Term>): CoastlineControl =>
    operator_app(substitute_in_unification_problem_then_continue_unifying_def, [
        operator_app(add_to_substitution_def, [sub, variable, term]),
        problem
    ])


// (Substitution, UnificationProblem, Variable, Term) => Substitution
export const eliminate_def = operator_definition('eliminate', ['substitution', 'problem', 'variable', 'term'], (inputs) =>
    expect_sub(inputs[0], (sub) => expect_unification_problem(inputs[1], (ues) => expect_variable(inputs[2], (v) => expect_term(inputs[3], (t) =>
        // This function's necessity is a good argument for adding declaration blocks as a kind of control.
        operator_app(substitute_in_unification_problem_then_continue_unifying_def, [
            operator_app(add_to_substitution_def, [sub, v, t]),
            ues
        ])
    ))))
)

// (Substitution, UnificationProblem) => Substitution
export const substitute_in_unification_problem_then_continue_unifying_def = operator_definition('substitute_in_unification_problem_then_continue_unifying', ['substitution', 'problem'], (inputs) =>
    expect_sub(inputs[0], (sub) => expect_unification_problem(inputs[1], (ues) =>
        operator_app(unify_def, [
            sub,
            operator_app(substitute_in_unification_problem_def, [sub, ues])
        ])
    ))
)

// (Substitution, UnificationProblem) => UnificationProblem
export const substitute_in_unification_problem_def = operator_definition('substitute_in_unification_problem', ['substitution', 'problem'], (inputs) =>
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
export const substitute_in_unification_equation_def = operator_definition('substitute_in_unification_equation_def', ['substitution', 'problem'], (inputs) =>
    expect_sub(inputs[0], (sub) => expect_unification_equation(inputs[1], (ue) =>
        operator_app(make_unification_equation_def, [
            operator_app(apply_substitution_def_2, [sub, ue.value.left]),
            operator_app(apply_substitution_def_2, [sub, ue.value.right])
        ])
    ))
)

export const make_unification_equation_def = operator_definition('make_unification_equation', ['left', 'right'], (inputs) =>
    expect_term(inputs[0], (l) => expect_term(inputs[1], (r) =>
        obj('UnificationEquation', { left: l, right: r })
    ))
)

// (UnificationEquation, UnificationProblem) => 
export const cons_unification_problem_def = operator_definition('cons_unification_problem_def', ['first_equation', 'rest_of_problem'], (inputs) =>
    expect_unification_equation(inputs[0], (ue) => expect_unification_problem(inputs[1], (ues) =>
        obj('UnificationProblem', [ue, ...ues.value])
    ))
)

// (Substitution, Variable, Term) => Substitution
export const add_to_substitution_def = operator_definition('add_to_substitution', ['substitution', 'variable', 'term'], (inputs) =>
    expect_sub(inputs[0], (sub) => expect_variable(inputs[1], (v) => expect_term(inputs[2], (t) =>
        options_tree([
            ['at_end_of_substitution', () => expect_empty_sub(sub, () => obj('NonEmptySub', { variable: v, term: t, rest: obj('EmptySub', []) }))],
            ['not_at_end_of_substitution', () => expect_non_empty_sub(sub, (nes) => operator_app(cons_sub_def, [
                nes.value.variable,
                operator_app(apply_substitution_def_2, [obj('NonEmptySub', { variable: v, term: t, rest: obj('EmptySub', []) }), nes.value.term]),
                operator_app(add_to_substitution_def, [nes.value.rest, v, t])
            ]))]
        ])
    )))
)

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////// PLAYING WITH TERMS ////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const succ_options = () =>
    options_tree([
        ['error', () => err('CannotSwapError', undefined)],
        ['succ', () => operator_app(succ_def, [succ_options()])],
        ['zero', () => obj('Natural_Number', 0)]
    ])

export const succ_def = operator_definition('succ', ['n'], (inputs) =>
    expect_natural(inputs[0], (n) =>
        obj('Natural_Number', n.value + 1)
    )
)

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////// BINARY TREES ///////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const expect_binary_tree = expect_types('EmptyBinTree', 'NonEmptyBinTree')

export const binary_tree_options = () =>
    options_tree([
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

export const empty_binary_tree_def = operator_definition('empty_binary_tree_def', ['value'], (inputs) =>
    expect_natural(inputs[0], (num) =>
        obj('EmptyBinTree', { num })
    )
)

export const non_empty_binary_tree_def = operator_definition('non_empty_binary_tree_def', ['value', 'left', 'right'], (inputs) =>
    expect_natural(inputs[0], (num) => expect_binary_tree(inputs[1], (left) => expect_binary_tree(inputs[2], (right) =>
        obj('NonEmptyBinTree', { num, left, right })
    )))
)

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////// MERGE SORT ////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const expect_natural_list = expect_type('NaturalList')

// (NaturalList) => NaturalList
export const merge_sort_def = operator_definition('merge_sort', ['list'], (inputs) =>
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

const skipped_list_before_index = (list: CoastlineObject<'NaturalList'>, index: CoastlineObject<'Natural_Number'>): CoastlineControl => {
    if (index.value < 0 || index.value >= list.value.length)
        return err('WithMessage', `Index ${index} is out of bounds 0 <= i < ${list.value.length}!`)
    return obj('NaturalList', list.value.slice(0, index.value))
}

const skipped_list_after_index = (list: CoastlineObject<'NaturalList'>, index: CoastlineObject<'Natural_Number'>): CoastlineControl => {
    if (index.value < 0 || index.value >= list.value.length)
        return err('WithMessage', `Index ${index} is out of bounds 0 <= i < ${list.value.length}!`)
    return obj('NaturalList', list.value.slice(index.value, list.value.length))
}

// (NaturalList, NaturalList) => NaturalList
export const merge_def = operator_definition('merge', ['left_list', 'right_list'], (inputs) =>
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

export const cons_natural_list_def = operator_definition('cons_natural_list', ['head', 'tail'], (inputs) =>
    expect_natural(inputs[0], (head) => expect_natural_list(inputs[1], (tail) =>
        obj('NaturalList', [head, ...tail.value])
    ))
)

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////// ARITHMETIC EXPRESSION EVALUATION /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const expect_arithmetic_expression = expect_types('Integer', 'NegativeExpression', 'PlusExpression', 'MinusExpression', 'TimesExpression')
export const expect_integer = expect_type('Integer')
export const expect_negative_expression = expect_type('NegativeExpression')
export const expect_plus_expression = expect_type('PlusExpression')
export const expect_minus_expression = expect_type('MinusExpression')
export const expect_times_expression = expect_type('TimesExpression')

export const evaluate_arithmetic_expression_def = operator_definition('evaluate_arithmetic_expression', ['expression'], (inputs) =>
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

export const integer_negate_def = operator_definition('negate', ['x'], (inputs) => expect_integer(inputs[0], (x) => obj('Integer', -x.value)))

export const mk_check_result_def = (actual_answer: number) => operator_definition('check_result', ['user_answer'], (inputs) =>
    expect_integer(inputs[0], (user_answer) => user_answer.value !== actual_answer ? err('WithMessage', `${user_answer.value} is not the answer.  Try again!`) : obj('Integer', user_answer.value))
)

export const integer_plus_def = operator_definition('plus', ['x', 'y'], (inputs) =>
    expect_integer(inputs[0], (x) => expect_integer(inputs[1], (y) =>
        operator_app(mk_check_result_def(x.value + y.value), [
            req2('Integer')
        ])
    ))
)

export const integer_minus_def = operator_definition('minus', ['x', 'y'], (inputs) =>
    expect_integer(inputs[0], (x) => expect_integer(inputs[1], (y) =>
        operator_app(mk_check_result_def(x.value - y.value), [
            req2('Integer')
        ])
    ))
)

export const integer_times_def = operator_definition('times', ['x', 'y'], (inputs) =>
    expect_integer(inputs[0], (x) => expect_integer(inputs[1], (y) =>
        operator_app(mk_check_result_def(x.value * y.value), [
            req2('Integer')
        ])
    ))
)

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////// PIERCE TYEPS AND PROGRAMMING LANGUAGES //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export type PT = CoastlineObject<'PierceTerm'>
export const expect_pierce_term = expect_type('PierceTerm')
export const expect_pierce_term_set = expect_type('PierceTermSet')

export const make_pierce_term_options_tree = () =>
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

export const if_then_else_def = operator_definition('if_then_else', ['t1', 't2', 't3'], (inputs) =>
    expect_pierce_term(inputs[0], (t1) => expect_pierce_term(inputs[1], (t2) => expect_pierce_term(inputs[2], (t3) =>
        obj('PierceTerm', { if: t1, then: t2, else: t3})
    )))
)

export const pierce_succ_def = operator_definition('succ', ['t'], (inputs) =>
    expect_pierce_term(inputs[0], (t) => obj('PierceTerm', { succ: t }))
)

export const pred_def = operator_definition('pred', ['t'], (inputs) =>
    expect_pierce_term(inputs[0], (t) => obj('PierceTerm', { pred: t }))
)

export const iszero_def = operator_definition('iszero', ['t'], (inputs) =>
    expect_pierce_term(inputs[0], (t) => obj('PierceTerm', { iszero: t }))
)

// (Natural_Number) => PierceTermSet
export const terms_set_def = operator_definition('terms_set', ['n'], (inputs) =>
    expect_natural(inputs[0], (n) =>
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

export const make_declare_pierce_term_set_then_op_def = (op_name: string, control_f: (c: CoastlineObject<'PierceTermSet'>) => CoastlineControl) =>
    operator_definition(op_name, ['list'], (inputs) =>
        expect_pierce_term_set(inputs[0], (list) => control_f(list)))

// (PierceTermSet, PierceTermSet) => PierceTermSet
export const union_pierce_term_sets_def = operator_definition('union', ['l1', 'l2'], (inputs) =>
    expect_pierce_term_set(inputs[0], (l1) => expect_pierce_term_set(inputs[1], (l2) =>
        obj('PierceTermSet', unionWith(l1.value, l2.value, isEqual))
    ))
)

export const succ_terms_set_def = operator_definition('succ_terms_set', ['term_set'], (inputs) =>
    expect_pierce_term_set(inputs[0], (term_set) =>
        obj('PierceTermSet', term_set.value.map((t) => obj('PierceTerm', { succ: t })))
    )
)

export const pred_terms_set_def = operator_definition('pred_terms_set', ['term_set'], (inputs) =>
    expect_pierce_term_set(inputs[0], (term_set) =>
        obj('PierceTermSet', term_set.value.map((t) => obj('PierceTerm', { pred: t })))
    )
)

export const iszero_terms_set_def = operator_definition('iszero_terms_set', ['term_set'], (inputs) =>
    expect_pierce_term_set(inputs[0], (term_set) =>
        obj('PierceTermSet', term_set.value.map((t) => obj('PierceTerm', { iszero: t })))
    )
)

export const if_then_else_terms_set_def = operator_definition('if_then_else_set', ['term_set'], (inputs) =>
    expect_pierce_term_set(inputs[0], (term_set) => {
        const ret_set: CoastlineObject<'PierceTermSet'> = obj('PierceTermSet', [])
        for (const t1 of term_set.value)
            for (const t2 of term_set.value)
                for (const t3 of term_set.value)
                    ret_set.value.push(obj('PierceTerm', { if: t1, then: t2, else: t3 }))
        return ret_set
    })
)

// (PierceTermSet) => Natural_Number
export const pierce_set_size_def = operator_definition('pierce_set_size', ['set'], (inputs) =>
    expect_pierce_term_set(inputs[0], (set) =>
        obj('Natural_Number', set.value.length)
    )
)

const pierce_term_cases = (
    term: PT,
    clause_true: [string, () => CoastlineControl],
    clause_false: [string, () => CoastlineControl],
    clause_0: [string, () => CoastlineControl],
    clause_succ: [string, (t: PT) => CoastlineControl],
    clause_pred: [string, (t: PT) => CoastlineControl],
    clause_iszero: [string, (t: PT) => CoastlineControl],
    clause_if_then_else: [string, (t1: PT, t2: PT, t3: PT) => CoastlineControl]
) => options_tree([
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

export const constants_in_pierce_term_def = operator_definition('constants_in_pierce_term', ['term'], (inputs) =>
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

// (PierceTerm) => Natural_Number
export const size_of_pierce_term_def = operator_definition('size_of_pierce_term', ['term'], (inputs) =>
    expect_pierce_term(inputs[0], (term) => pierce_term_cases(term,
        ['input_is_true', () => nat(1)],
        ['input_is_false', () => nat(1)],
        ['input_is_0', () => nat(1)],
        ['input_is_succ', (t) => operator_app(plus_def, [
            operator_app(size_of_pierce_term_def, [t]),
            nat(1)
        ])],
        ['input_is_pred', (t) => operator_app(plus_def, [
            operator_app(size_of_pierce_term_def, [t]),
            nat(1)
        ])],
        ['input_is_iszero', (t) => operator_app(plus_def, [
            operator_app(size_of_pierce_term_def, [t]),
            nat(1)
        ])],
        ['input_is_if_then_else', (t1, t2, t3) => operator_app(plus_def, [
            operator_app(size_of_pierce_term_def, [t1]),
            operator_app(plus_def, [
                operator_app(size_of_pierce_term_def, [t2]),
                operator_app(size_of_pierce_term_def, [t3]),
            ])
        ])]
    ))
)

// (PierceTerm) => Natural_Number
export const depth_of_pierce_term_def = operator_definition('depth_of_pierce_term', ['term'], (inputs) =>
    expect_pierce_term(inputs[0], (term) => pierce_term_cases(term,
        ['input_is_true', () => nat(1)],
        ['input_is_false', () => nat(1)],
        ['input_is_0', () => nat(1)],
        ['input_is_succ', (t) => operator_app(plus_def, [
            operator_app(size_of_pierce_term_def, [t]),
            nat(1)
        ])],
        ['input_is_pred', (t) => operator_app(plus_def, [
            operator_app(size_of_pierce_term_def, [t]),
            nat(1)
        ])],
        ['input_is_iszero', (t) => operator_app(plus_def, [
            operator_app(size_of_pierce_term_def, [t]),
            nat(1)
        ])],
        ['input_is_if_then_else', (t1, t2, t3) => operator_app(max_def, [
            operator_app(depth_of_pierce_term_def, [t1]),
            operator_app(max_def, [
                operator_app(depth_of_pierce_term_def, [t2]),
                operator_app(depth_of_pierce_term_def, [t3]),
            ])
        ])]
    ))
)

export const evaluate_boolean_pierce_term_def = operator_definition('evaluate_boolean_pierce_term', ['term'], (inputs) =>
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
////////////////////////////////////////// PIERCE TYEPS AND PROGRAMMING LANGUAGES //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const expect_ecc_term = expect_types('ECCProp', 'ECCType', 'ECCVariable', 'ECCApplication', 'ECCPi', 'ECCLambda', 'ECCSigma', 'ECCPair', 'ECCProject', 'ECCArrow', 'ECCProduct')
const expect_ecc_prop = expect_type('ECCProp')
const expect_ecc_type = expect_type('ECCType')
const expect_ecc_variable = expect_type('ECCVariable')
const expect_ecc_pair = expect_type('ECCPair')
const expect_ecc_projection = expect_type('ECCProject')
const expect_ecc_application = expect_type('ECCApplication')
const expect_ecc_arrow = expect_type('ECCArrow')
const expect_ecc_product = expect_type('ECCProduct')
const expect_ecc_pi = expect_type('ECCPi')
const expect_ecc_lambda = expect_type('ECCLambda')
const expect_ecc_sigma = expect_type('ECCSigma')
const expect_ecc_binder = expect_types('ECCPi', 'ECCLambda', 'ECCSigma')
const expect_ecc_term_set = expect_type('ECCTermSet')
const ecc_term_set = (...terms: CoastlineObject<ECCTerm>[]) => obj('ECCTermSet', terms)

export const type_universe_def = operator_definition('type_universe', ['order'], (inputs) =>
    expect_natural(inputs[0], (order) => obj('ECCType', order.value)))

export const variable_def = operator_definition('variable', ['id'], (inputs) =>
    expect_string(inputs[0], (id) => obj('ECCVariable', id.value)))

export const application_def = operator_definition('application', ['head', 'arg'], (inputs) =>
    expect_ecc_term(inputs[0], (head) => expect_ecc_term(inputs[1], (arg) => obj('ECCApplication', { head, arg }))))

export const arrow_def = operator_definition('arrow', ['input_type', 'output_type'], (inputs) =>
    expect_ecc_term(inputs[0], (input) => expect_ecc_term(inputs[1], (output) => obj('ECCArrow', { input, output }))))

export const product_def = operator_definition('product', ['left_type', 'right_type'], (inputs) =>
    expect_ecc_term(inputs[0], (left) => expect_ecc_term(inputs[1], (right) => obj('ECCProduct', { left, right }))))

export const pi_def = operator_definition('pi', ['bound', 'bound_type', 'scope'], (inputs) =>
    expect_ecc_variable(inputs[0], (bound) => expect_ecc_term(inputs[1], (bound_type) => expect_ecc_term(inputs[2], (scope) =>
        obj('ECCPi', { bound, bound_type, scope })))))

export const sigma_def = operator_definition('sigma', ['bound', 'bound_type', 'scope'], (inputs) =>
    expect_ecc_variable(inputs[0], (bound) => expect_ecc_term(inputs[1], (bound_type) => expect_ecc_term(inputs[2], (scope) =>
        obj('ECCSigma', { bound, bound_type, scope })))))

export const lambda_def = operator_definition('lambda', ['bound', 'bound_type', 'scope'], (inputs) =>
    expect_ecc_variable(inputs[0], (bound) => expect_ecc_term(inputs[1], (bound_type) => expect_ecc_term(inputs[2], (scope) =>
        obj('ECCLambda', { bound, bound_type, scope })))))

export const pair_def = operator_definition('pair', ['pair_type', 'left', 'right'], (inputs) =>
    expect_ecc_term(inputs[0], (pair_type) => expect_ecc_term(inputs[1], (left) => expect_ecc_term(inputs[2], (right) =>
        obj('ECCPair', { pair_type, left, right })))))

export const left_projection_def = operator_definition('left_projection', ['pair'], (inputs) =>
    expect_ecc_term(inputs[0], (pair) => obj('ECCProject', { project: 'left', pair })))

export const right_projection_def = operator_definition('right_projection', ['pair'], (inputs) =>
    expect_ecc_term(inputs[0], (pair) => obj('ECCProject', { project: 'right', pair })))

export const ecc_term_options = () => options_tree([
    ['Prop', () => obj('ECCProp', undefined)],
    ['Type', () => operator_app(type_universe_def, [req2('Natural_Number')])],
    ['Variable', () => operator_app(variable_def, [req2('String')])],
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

export const check_ecc_free_variables = (term: CoastlineObject<ECCTerm>): CoastlineControl =>
    check_coastline_correctness(
        ecc_free_variables(term),
        operator_app(ecc_free_variables_def, [term])
    )

const ecc_free_variables = (term: CoastlineObject<ECCTerm>): CoastlineObject<'ECCTermSet'> => {
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
export const ecc_free_variables_def = operator_definition('free_variables', ['term'], (inputs) =>
    expect_ecc_term(inputs[0], (term) => options_tree([
        // ['no_free_variables', () => ],
        ['prop', () => expect_ecc_prop(term, () => ecc_term_set())],
        ['type', () => expect_ecc_type(term, () => ecc_term_set())],
        ['variable', () => expect_ecc_variable(term, (v) => ecc_term_set(v))],
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

const ecc_terms_syntactically_equal = (t1: CoastlineObject<ECCTerm>, t2: CoastlineObject<ECCTerm>): boolean => {
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

const ecc_term_appears_in_term_set = (term: CoastlineObject<ECCTerm>, set: CoastlineObject<'ECCTermSet'>): boolean =>
    defined(set.value.find((t) => ecc_terms_syntactically_equal(term, t)))

export const union_ecc_term_set_def = operator_definition('union_term_set', ['set1', 'set2'], (inputs) =>
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

const remove_from_ecc_term_set = (term: CoastlineObject<ECCTerm>, set: CoastlineObject<'ECCTermSet'>): CoastlineObject<'ECCTermSet'> =>
    obj('ECCTermSet', set.value.filter((t) => !ecc_terms_syntactically_equal(term, t)))

const expect_confirmation = expect_type('Confirmation')

export const check_coastline_correctness = (actual_answer: AnyCoastlineObject, control: CoastlineControl): CoastlineControl => {
    const check_correctness_def = operator_definition('check_correctness', ['confirmation', 'your_answer'], (inputs) =>
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

export const remove_from_ecc_term_set_def = operator_definition('remove_from_term_set', ['term', 'set'], (inputs) =>
    expect_ecc_term(inputs[0], (term) => expect_ecc_term_set(inputs[1], (set) =>
        operator_app(remove_from_ecc_term_set_acc_def, [term, set, ecc_term_set()])
    ))
)

export const remove_from_ecc_term_set_acc_def = operator_definition('remove_from_term_set_acc', ['term', 'set', 'set_to_return'], (inputs) =>
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

export const check_ecc_term_abbreviate = (term: CoastlineObject<ECCTerm>): CoastlineControl =>
    check_coastline_correctness(
        ecc_term_abbreviate(term),
        operator_app(ecc_term_abbreviate_def, [term])
    )

const ecc_term_abbreviate = (term: CoastlineObject<ECCTerm>): CoastlineObject<ECCTerm> => {
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

export const ecc_term_abbreviate_def = operator_definition('abbreviate', ['term'], (inputs) =>
    expect_ecc_term(inputs[0], (term) => options_tree([
        ['do not change', () => term],
        ['to function type', () =>
            cta('ECCPi', term) || cta('ECCSigma', term)
            ? obj('ECCArrow', { input: term.value.bound_type, output: term.value.scope })
            : err('WithMessage', 'You can only abbreviate Pi and Sigma types!')
        ],
        ['to product type', () =>
            cta('ECCPi', term) || cta('ECCSigma', term)
            ? obj('ECCProduct', { left: term.value.bound_type, right: term.value.scope })
            : err('WithMessage', 'You can only abbreviate Pi and Sigma types!')
        ],
    ]))
)

// export const ecc_alpha_equals = operator_definition('alpha_equals', ['term1', 'term2'], (inputs) =>

// )

const ecc_possibly_rename_bound_to_avoid_set = (bound: CoastlineObject<'ECCVariable'>, set: CoastlineObject<'ECCTermSet'>): CoastlineObject<'ECCVariable'> => {
    let current_bound = bound
    while (ecc_term_appears_in_term_set(current_bound, set))
        current_bound = obj('ECCVariable', `${current_bound.value}'`)
    return current_bound
}

const ecc_binder_capture_avoiding_substitution = (replace_v: CoastlineObject<'ECCVariable'>, with_t: CoastlineObject<ECCTerm>, in_t: CoastlineObject<'ECCLambda' | 'ECCPi' | 'ECCSigma'>): CoastlineObject<'ECCLambda' | 'ECCPi' | 'ECCSigma'> => {
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

const ecc_capture_avoiding_substitution = (replace_v: CoastlineObject<'ECCVariable'>, with_t: CoastlineObject<ECCTerm>, in_t: CoastlineObject<ECCTerm>): CoastlineObject<ECCTerm> => {
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
export const ecc_capture_avoiding_substitution_def = operator_definition('capture_avoiding_substitution', ['to_replace', 'replacement', 'in'], (inputs) =>
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
                    operator_app(ecc_check_variable_not_in_set_def, [
                        operator_app(variable_def, [
                            req2('String'),
                        ]),
                        operator_app(ecc_free_variables_def, [replacement_t])
                    ]),
                    to_replace_v,
                    replacement_t,
                    lambda
                ])
            )],
            ['in pi', () => expect_ecc_pi(in_t, (lambda) =>
                operator_app(ecc_capture_avoiding_substitution_with_new_bound_variable_in_pi_def, [
                    operator_app(ecc_check_variable_not_in_set_def, [
                        operator_app(variable_def, [
                            req2('String'),
                        ]),
                        operator_app(ecc_free_variables_def, [replacement_t])
                    ]),
                    to_replace_v,
                    replacement_t,
                    lambda
                ])
            )],
            ['in sigma', () => expect_ecc_sigma(in_t, (lambda) =>
                operator_app(ecc_capture_avoiding_substitution_with_new_bound_variable_in_sigma_def, [
                    operator_app(ecc_check_variable_not_in_set_def, [
                        operator_app(variable_def, [
                            req2('String'),
                        ]),
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

export const ecc_check_variable_not_in_set_def = operator_definition('check_variable_not_in_set', ['variable', 'set'], (inputs) =>
    expect_ecc_variable(inputs[0], (variable) => expect_ecc_term_set(inputs[1], (set) =>
        ecc_term_appears_in_term_set(variable, set) ? err('WithMessage', 'The given Variable appears in a given Set.  Try again.')
        : variable
    ))
)

export const ecc_capture_avoiding_substitution_with_new_bound_variable_in_lambda_def = operator_definition('capture_avoiding_substitution_with_new_bound_variable_in_lambda', ['new_variable', 'to_replace', 'replacement', 'in'], (inputs) =>
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

export const ecc_capture_avoiding_substitution_with_new_bound_variable_in_pi_def = operator_definition('capture_avoiding_substitution_with_new_bound_variable_in_pi', ['new_variable', 'to_replace', 'replacement', 'in'], (inputs) =>
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

export const ecc_capture_avoiding_substitution_with_new_bound_variable_in_sigma_def = operator_definition('capture_avoiding_substitution_with_new_bound_variable_in_pi', ['new_variable', 'to_replace', 'replacement', 'in'], (inputs) =>
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

// const ecc_binder_capture_avoiding_substitution = (replace_v: CoastlineObject<'ECCVariable'>, with_t: CoastlineObject<ECCTerm>, in_t: CoastlineObject<ECCBinder>): CoastlineObject<ECCBinder> => {
//     const with_fvs = ecc_free_variables(with_t)
//     const new_bound = ecc_possibly_rename_bound_to_avoid_set(in_t.value.bound, with_fvs)
//     return obj(in_t.type, {
//         bound: new_bound,
//         bound_type: ecc_capture_avoiding_substitution(replace_v, with_t, in_t.value.bound_type),
//         scope: ecc_capture_avoiding_substitution(
//             replace_v,
//             with_t,
//             in_t.value.bound.value !== new_bound.value
//             ? in_t.value.bound
//             : ecc_capture_avoiding_substitution(in_t.value.bound, new_bound, in_t.value.scope)
//         )
//     })
// }