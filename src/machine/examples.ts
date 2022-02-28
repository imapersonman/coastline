import { first, rest } from "../utilities"
import { CoastlineControl } from "./control"
import { err } from "./error"
import { AnyCoastlineObject, CoastlineObject, CoastlineObjectValueMap, cta, obj } from "./object"
import { operator_app, operator_definition } from "./operator"
import { options_tree } from "./options_tree"
import { req } from "./request"
import { expect_type, expect_types } from "./utilities"

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////// FIBONACCI /////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const expect_natural = expect_type('Natural_Number')

export const fib_def = operator_definition('fib', (inputs) =>
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

const plus_def = operator_definition('plus', (inputs) =>
    expect_natural(inputs[0], (n1) =>
        expect_natural(inputs[1], (n2) =>
            obj('Natural_Number', n1.value + n2.value)
        )
    )
)

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////// TERMS_EQUAL ////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const expect_term     = expect_type('Term')
const expect_atom     = expect_type('TermAtom')
const expect_variable = expect_type('TermVariable')
const expect_boolean  = expect_type('Boolean')
const expect_list     = expect_type('TermList')

// (Term, Term) => Boolean
export const terms_equal_def = operator_definition('terms_equal', (inputs) =>
    expect_term(inputs[0], (t1) => expect_term(inputs[1], (t2) =>
        options_tree([
            ['atoms',           () => operator_app(atoms_equal_def,     [t1.value, t2.value])],
            ['variables',       () => operator_app(variables_equal_def, [t1.value, t2.value])],
            ['lists',           () => operator_app(lists_equal_def,     [t1.value, t2.value])],
            ['different_types', () => obj('Boolean', false)]
        ])
    ))
)

// (TermAtom, TermAtom) => Boolean
export const atoms_equal_def = operator_definition('atoms_equal', (inputs) =>
    expect_atom(inputs[0], (a1) => expect_atom(inputs[1], (a2) =>
        options_tree([
            ['atoms_are_equal',     () => a1.value !== a2.value ? err('TermsAreNotEqual', { term1: obj('Term', a1), term2: obj('Term', a2) }) : obj('Boolean', true)],
            ['atoms_are_not_equal', () => a1.value === a2.value ? err('TermsAreEqual',    { term1: obj('Term', a1), term2: obj('Term', a2) }) : obj('Boolean', false)]
        ])
    ))
)

// (TermVariable, TermVariable) => Boolean
export const variables_equal_def = operator_definition('variables_equal', (inputs) =>
    expect_variable(inputs[0], (v1) => expect_variable(inputs[1], (v2) =>
        options_tree([
            ['atoms_are_equal',     () => v1.value !== v2.value ? err('TermsAreNotEqual',  { term1: obj('Term', v1), term2: obj('Term', v2) }) : obj('Boolean', true)],
            ['atoms_are_not_equal', () => v1.value === v2.value ? err('TermsAreEqual',     { term1: obj('Term', v1), term2: obj('Term', v2) }) : obj('Boolean', false)]
        ])
    ))
)

// (Boolean, Boolean) => Boolean
export const and_def = operator_definition('and', (inputs: AnyCoastlineObject[]) =>
    expect_boolean(inputs[0], (b1) => expect_boolean(inputs[1], (b2) =>
        obj('Boolean', b1.value && b2.value)
    ))
)

// (TermList, TermList) => Boolean
export const lists_equal_def = operator_definition('lists_equal', (inputs: AnyCoastlineObject[]) =>
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
const expect_sub           = expect_type('Substitution')
const expect_empty_sub     = expect_type('EmptySub')
const expect_non_empty_sub = expect_type('NonEmptySub')

export const apply_substitution_def_2 = operator_definition('apply_substitution', (inputs) =>
    expect_sub(inputs[0], (s) => expect_term(inputs[1], (t) =>
        options_tree([
            ['atom', () => expect_atom(t.value, () => t)],
            ['variable', () => operator_app(apply_substitution_to_variable_def, [s, t.value])],
            ['list', () => operator_app(as_term_def, [operator_app(apply_substitution_to_list_def_2, [s, t.value])])]
        ])
    ))
)

export const apply_substitution_to_variable_def = operator_definition('apply_substitution_to_variable', (inputs) =>
    expect_sub(inputs[0], (s) => expect_variable(inputs[1], (v) =>
        options_tree([
            ['empty_sub', () => expect_empty_sub(s.value, () => v)],
            ['first_substitution_equals_variable', () => expect_non_empty_sub(s.value, (nes) =>
                nes.value.variable.value !== v.value
                    ? err('TermsAreNotEqual', { term1: obj('Term', nes.value.variable), term2: obj('Term', v) })
                    : nes.value.term
            )],
            ['first_substitution_does_not_equal_variable', () => expect_non_empty_sub(s.value, (nes) =>
                nes.value.variable.value === v.value
                    ? err('TermsAreEqual', { term1: obj('Term', nes.value.variable), term2: obj('Term', v) })
                    : operator_app(apply_substitution_to_variable_def, [nes.value.rest, v])
            )]
        ])
    ))
)

export const apply_substitution_to_list_def_2 = operator_definition('apply_substitution_to_list_def_2', (inputs) =>
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

// (Substitution, Term) => Term
export const apply_substitution_def = operator_definition('apply_substitution', (inputs) =>
    expect_sub(inputs[0], (s) => expect_term(inputs[1], (t) =>
        options_tree([
            ['empty_sub',     () => expect_empty_sub    (s.value, () => t)],
            ['non_empty_sub', () => expect_non_empty_sub(s.value, () => operator_app(apply_non_empty_sub_def, [s.value, t]))]
        ])
    ))
)

// (NonEmptySub, Term) => Term
export const apply_non_empty_sub_def = operator_definition('apply_non_empty_substitution', (inputs) =>
    expect_non_empty_sub(inputs[0], (s) => expect_term(inputs[1], (t) =>
        options_tree([
            ['atom',     () => expect_atom(t.value, () => t)],
            ['variable', () => operator_app(sub_single_in_variable_def, [s.value.variable, s.value.term, t.value])],
            ['list',     () => operator_app(as_term_def, [operator_app(apply_substitution_to_list_def, [obj('Substitution', s), t.value])])]
        ])
    ))
)

// (TermVariable, Term, Variable) => Term
export const sub_single_in_variable_def = operator_definition('sub_single_in_atom', (inputs) =>
    expect_variable(inputs[0], (from_v) => expect_term(inputs[1], (to_t) => expect_variable(inputs[2], (in_v) =>
        options_tree([
            ['replace_variable',        () => from_v.value !== in_v.value ? err('TermsAreNotEqual', { term1: obj('Term', from_v), term2: obj('Term', in_v) }) : to_t],
            ['do_not_replace_variable', () => from_v.value === in_v.value ? err('TermsAreEqual',    { term1: obj('Term', from_v), term2: obj('Term', in_v) }) : obj('Term', in_v)]
        ])
    )))
)

// (Substitution, TermList) => TermList
export const apply_substitution_to_list_def = operator_definition('apply_substitution_to_list_def', (inputs) =>
    expect_sub(inputs[0], (s) => expect_list(inputs[1], (l) =>
        options_tree([
            ['list_is_empty',     () => l.value.length !== 0 ? err('ListIsNotEmpty', l) : l],
            ['list_is_not_empty', () => l.value.length === 0 ? err('ListIsEmpty', l)
                : operator_app(cons_def, [
                    operator_app(apply_substitution_def, [s, first(l.value)]),
                    obj('TermList', rest(l.value))
                ])
            ]
        ])
    ))
)

export const cons_def = operator_definition('cons', (inputs) =>
    expect_term(inputs[0], (t) => expect_list(inputs[1], (l) =>
        obj('TermList', [t, ...l.value])
    ))
)

// (s1 o s2)(f) = s1(s2(f)),
// so we should append s1 to the end of s2, applying s1 to every term in s2.
// if there are conflicting variables, the one seen in 
export const compose_substitutions_def = operator_definition('compose_substitutions', (inputs) =>
    expect_sub(inputs[0], (s1) => expect_sub(inputs[1], (s2) =>
        options_tree([
            ['second_sub_is_empty',     () => expect_empty_sub    (s2, ()     => s1)],
            ['second_sub_is_non_empty', () => expect_non_empty_sub(s2, (nes2) =>
                operator_app(cons_sub_def, [
                    nes2.value.variable,
                    operator_app(apply_substitution_def, [
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
export const cons_sub_def = operator_definition('cons_substitution', (inputs) =>
    expect_variable(inputs[0], (v) => expect_term(inputs[1], (t) => expect_sub(inputs[2], (s) =>
        obj('Substitution', obj('NonEmptySub', { variable: v, term: t, rest: s }))
    )))
)

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////// BUILDING TERMS //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const expect_string = expect_type('String')

export const as_term_def = operator_definition('as_term', (inputs) =>
    expect_types('TermAtom', 'TermVariable', 'TermList')(inputs[0], (t) => obj('Term', t))
)

export const build_term_def = operator_definition('build_term', () =>
    options_tree([
        ['atom',     () => req({ type: 'AtomName',   payload: undefined }, (name) => expect_string(name, ({ value }) => obj('Term', obj('TermAtom',     value))))],
        ['variable', () => req({ type: 'VariableId', payload: undefined }, (id)   => expect_string(id,   ({ value }) => obj('Term', obj('TermVariable', value))))],
        ['list',     () => operator_app(as_term_def, [operator_app(build_list_def, [])])]
    ])
)

export const build_list_def = operator_definition('build_list', () =>
    options_tree([
        ['empty',     () => obj('TermList', [])],
        ['non_empty', () => operator_app(cons_def, [
            operator_app(build_term_def, []),
            operator_app(build_list_def, [])
        ])]
    ])
)

