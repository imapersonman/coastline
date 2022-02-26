import { CoastlineControl, display_coastline_control } from "../../src/machine/control"
import { err, is_coastline_error } from "../../src/machine/error"
import { choice, finished_machine, response, run_machine_with_script, start_machine } from "../../src/machine/machine"
import { AnyCoastlineObject, CoastlineObject, CoastlineObjectValueMap, cta, display_coastline_object, is_coastline_object, obj, object_constructor } from "../../src/machine/object"
import { is_operator_app, OperatorApplication, OperatorDefinition, operator_app, operator_definition } from "../../src/machine/operator"
import { is_options_tree, OptionsTree, options_tree } from "../../src/machine/options_tree"
import { AnyCoastlineRequest, is_coastline_request, req } from "../../src/machine/request"
import { expect_type } from "../../src/machine/utilities"
import { display_stack, is_empty_stack, is_non_empty_stack, mk_stack, pop_entry, possibly_pop_n_entries, push_entries, push_entry, Stack } from "../../src/stack"
import { defined, first, is_array, is_string, rest } from "../../src/utilities"


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////// FIBONACCI /////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const expect_natural = expect_type('Natural_Number')

const fib_def = operator_definition('fib', (inputs) =>
    expect_natural(inputs[0], (n) =>
        options_tree([
            ['zero'  , () => n.value !== 0 ? err('InputNotEqualTo', 0) : obj('Natural_Number', 0)],
            ['one'   , () => n.value !== 1 ? err('InputNotEqualTo', 1) : obj('Natural_Number', 1)],
            ['gt_two', () => n.value   < 2 ? err('InputNotGreaterThanOrEqualTo', 2)
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
const terms_equal_def = operator_definition('terms_equal', (inputs) =>
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
const atoms_equal_def = operator_definition('atoms_equal', (inputs) =>
    expect_atom(inputs[0], (a1) => expect_atom(inputs[1], (a2) =>
        options_tree([
            ['atoms_are_equal',     () => a1.value !== a2.value ? err('TermsAreNotEqual', { term1: obj('Term', a1), term2: obj('Term', a2) }) : obj('Boolean', true)],
            ['atoms_are_not_equal', () => a1.value === a2.value ? err('TermsAreEqual',    { term1: obj('Term', a1), term2: obj('Term', a2) }) : obj('Boolean', false)]
        ])
    ))
)

// (TermVariable, TermVariable) => Boolean
const variables_equal_def = operator_definition('variables_equal', (inputs) =>
    expect_variable(inputs[0], (v1) => expect_variable(inputs[1], (v2) =>
        options_tree([
            ['atoms_are_equal',     () => v1.value !== v2.value ? err('TermsAreNotEqual',  { term1: obj('Term', v1), term2: obj('Term', v2) }) : obj('Boolean', true)],
            ['atoms_are_not_equal', () => v1.value === v2.value ? err('TermsAreEqual',     { term1: obj('Term', v1), term2: obj('Term', v2) }) : obj('Boolean', false)]
        ])
    ))
)

// (Boolean, Boolean) => Boolean
const and_def = operator_definition('and', (inputs: AnyCoastlineObject[]) =>
    expect_boolean(inputs[0], (b1) => expect_boolean(inputs[1], (b2) =>
        obj('Boolean', b1.value && b2.value)
    ))
)

// (TermList, TermList) => Boolean
const lists_equal_def = operator_definition('lists_equal', (inputs: AnyCoastlineObject[]) =>
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

// (Substitution, Term) => Term
const apply_substitution_def = operator_definition('apply_substitution', (inputs) =>
    expect_sub(inputs[0], (s) => expect_term(inputs[1], (t) =>
        options_tree([
            ['empty_sub',     () => expect_empty_sub    (s, () => t)],
            ['non_empty_sub', () => expect_non_empty_sub(s, () => operator_app(apply_non_empty_sub_def, [s, t]))]
        ])
    ))
)

// (NonEmptySub, Term) => Term
const apply_non_empty_sub_def = operator_definition('apply_non_empty_substitution', (inputs) =>
    expect_non_empty_sub(inputs[0], (s) => expect_term(inputs[1], (t) =>
        options_tree([
            ['atom',     () => expect_atom(t.value, () => t)],
            ['variable', () => operator_app(sub_single_in_variable_def,     [s.value.variable, s.value.term, t])],
            // THERE'S A PROBLEM HERE: Currently returning TermList, but this should return a Term.
            ['list',     () => operator_app(apply_substitution_to_list_def, [s.value.variable, s.value.term, t])]
        ])
    ))
)

// (TermVariable, Term, Variable) => Term
const sub_single_in_variable_def = operator_definition('sub_single_in_atom', (inputs) =>
    expect_variable(inputs[0], (from_v) => expect_term(inputs[1], (to_t) => expect_variable(inputs[2], (in_v) =>
        options_tree([
            ['replace_variable',        () => from_v.value !== in_v.value ? err('TermsAreNotEqual', { term1: obj('Term', from_v), term2: obj('Term', in_v) }) : to_t],
            ['do_not_replace_variable', () => from_v.value === in_v.value ? err('TermsAreEqual',    { term1: obj('Term', from_v), term2: obj('Term', in_v) }) : obj('Term', in_v)]
        ])
    )))
)

// (Substitution, TermList) => TermList
const apply_substitution_to_list_def = operator_definition('apply_substitution_to_list_def', (inputs) =>
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

const cons_def = operator_definition('cons', (inputs) =>
    expect_term(inputs[0], (t) => expect_list(inputs[1], (l) =>
        obj('TermList', [t, ...l.value])
    ))
)

// (s1 o s2)(f) = s1(s2(f)),
// so we should append s1 to the end of s2, applying s1 to every term in s2.
// if there are conflicting variables, the one seen in 
const compose_substitutions_def = operator_definition('compose_substitutions', (inputs) =>
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
const cons_sub_def = operator_definition('cons_substitution', (inputs) =>
    expect_variable(inputs[0], (v) => expect_term(inputs[1], (t) => expect_sub(inputs[2], (s) =>
        obj('Substitution', obj('NonEmptySub', { variable: v, term: t, rest: s }))
    )))
)

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////// BUILDING TERMS //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const expect_types = <CT extends keyof CoastlineObjectValueMap>(...cts: CT[]) => (o: AnyCoastlineObject, f: (o: CoastlineObject<CT>) => CoastlineControl): CoastlineControl => {
    for (const ct of cts)
        if (cta(ct, o))
            return f(o)
    return err('ObjectNotOfAnyType', { expected: cts, actual: o.type })
}

const expect_string = expect_type('String')

const as_term_def = operator_definition('as_term', (inputs) =>
    expect_types('TermAtom', 'TermVariable', 'TermList')(inputs[0], (t) => obj('Term', t))
)

const build_term_def = operator_definition('build_term', () =>
    options_tree([
        ['atom',     () => req({ type: 'AtomName',   payload: undefined }, (name) => expect_string(name, ({ value }) => obj('Term', obj('TermAtom',     value))))],
        ['variable', () => req({ type: 'VariableId', payload: undefined }, (id)   => expect_string(id,   ({ value }) => obj('Term', obj('TermVariable', value))))],
        ['list',     () => operator_app(as_term_def, [operator_app(build_list_def, [])])]
    ])
)

const build_list_def = operator_definition('build_list', () =>
    options_tree([
        ['empty',     () => obj('TermList', [])],
        ['non_empty', () => operator_app(cons_def, [
            operator_app(build_term_def, []),
            operator_app(build_list_def, [])
        ])]
    ])
)

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////// EXECUTION TREE //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
const term_building_list_a_b = [
    // give machine the initial control, which in this case is an operator_application.
    { // USER IS NOT SHOWN THIS STEP
        control    : operator_app(build_term_def, []),
        stack      : mk_stack(),
        operations : mk_stack(),
        results    : mk_stack()
    },
    { // USER IS NOT SHOWN THIS STEP
        control    : undefined,
        stack      : mk_stack(),
        operations : mk_stack(
            pending_operation(build_term_def, 0)
        ),
        results    : mk_stack()
    },
    // expand the operator_application in the control and stop the expansion once an options_tree is encountered.
    {
        control:
            options_tree([
                ['atom',     () => req({ type: 'AtomName',   payload: undefined }, (name) => expect_string(name, ({ value }) => obj('Term', obj('TermAtom',     value))))],
                ['variable', () => req({ type: 'VariableId', payload: undefined }, (id)   => expect_string(id,   ({ value }) => obj('Term', obj('TermVariable', value))))],
                ['list',     () => operator_app(build_list_def, [])]
            ]),
        stack    : mk_stack(),
        operations : mk_stack(),
        results    : mk_stack()
    },
    // choose 'list'
    // choosing a path to go down should automaticall 
    { // USER IS NOT SHOWN THIS STEP
        control    : operator_app(build_list_def, []),
        stack      : mk_stack(),
        operations : mk_stack(),
        results    : mk_stack()
    },
    // +--> step_machine(m)
    //      +--> step_machine_with_operations_application(m)
    {
        control    : 
            options_tree([
                ['empty',     () => obj('Term', obj('TermList', []))],
                ['non_empty', () => operator_app(cons_def, [
                    operator_app(build_term_def, []),
                    operator_app(build_list_def, [])
                ])]
            ]),
        stack      : mk_stack(),
        operations : mk_stack(),
        results    : mk_stack()
    },
    // choose 'non_empty'
    // choose_machine_path(m, 'non_empty')
    { // USER IS NOT SHOWN THIS STEP
        control    :
            operator_app(cons_def, [
                operator_app(build_term_def, []),
                operator_app(build_list_def, [])
            ]),
        stack      : mk_stack(),
        operations : mk_stack(),
        results    : mk_stack()
    },
    // +--> step_machine(m)
    //      +--> step_machine_with_operations_application(m)
    //      |    |--> push_entries(m.stack, m.control.arguments)
    //      |    +--> push_entry(m.operations, pending_operation(m.control.operation, m.control.arguments.length))
    { // USER IS NOT SHOWN THIS STEP
        control    : undefined,
        stack      : mk_stack(
            operator_app(build_term_def, []),
            operator_app(build_list_def, [])
        ),
        operations : mk_stack(
            pending_operation(cons_def, 2)
        ),
        results    : mk_stack()
    },
    //      +--> set_control(m, pop_entry(m.stack)[0]), 
    { // USER IS NOT SHOWN THIS STEP
        control    : operator_app(build_term_def, []),
        stack      : mk_stack(
            operator_app(build_list_def, [])
        ),
        operations : mk_stack(
            pending_operation(cons_def, 2)
        ),
        results    : mk_stack()
    },
    { // USER IS NOT SHOWN THIS STEP
        control    :
            options_tree([
                ['atom',     () => req({ type: 'AtomName',   payload: undefined }, (name) => expect_string(name, ({ value }) => obj('Term', obj('TermAtom',     value))))],
                ['variable', () => req({ type: 'VariableId', payload: undefined }, (id)   => expect_string(id,   ({ value }) => obj('Term', obj('TermVariable', value))))],
                ['list',     () => operator_app(build_list_def, [])]
            ]),
        stack      : mk_stack(
            operator_app(build_list_def, [])
        ),
        operations : mk_stack(
            pending_operation(cons_def, 2)
        ),
        results    : mk_stack()
    },
    // choose 'atom'
    {
        control    :
            req({ type: 'AtomName',   payload: undefined }, (name) => expect_string(name, ({ value }) => obj('Term', obj('TermAtom', value)))),
        stack      : mk_stack<CoastlineControl>(
            operator_app(build_list_def, [])
        ),
        operations : mk_stack(
            pending_operation(cons_def, 2)
        ),
        results    : mk_stack()
    },
    // respond_with 'a'
    { // USER IS NOT SHOWN THIS STEP
        control    :
            obj('Term', obj('TermAtom', 'a')),
        stack      : mk_stack<CoastlineControl>(
            operator_app(build_list_def, [])
        ),
        operations : mk_stack(
            pending_operation(cons_def, 2)
        ),
        results    : mk_stack()
    },
    { // USER IS NOT SHOWN THIS STEP
        control    : operator_app(build_list_def, []),
        stack      : mk_stack<CoastlineControl>(
            operator_app(build_list_def, [])
        ),
        operations : mk_stack(
            pending_operation(cons_def, 2)
        ),
        results    : mk_stack(
            obj('Term', obj('TermAtom', 'a'))
        )
    },
    {
        control    :
            options_tree([
                ['empty',     () => obj('Term', obj('TermList', []))],
                ['non_empty', () => operator_app(cons_def, [
                    operator_app(build_term_def, []),
                    operator_app(build_list_def, [])
                ])]
            ]),
        stack      : mk_stack<CoastlineControl>(),
        operations : mk_stack(
            pending_operation(cons_def, 2)
        ),
        results    : mk_stack(
            obj('Term', obj('TermAtom', 'a'))
        )
    },
    // choose non_empty
    { // USER IS NOT SHOWN THIS STEP
        control    :
            operator_app(cons_def, [
                operator_app(build_term_def, []),
                operator_app(build_list_def, [])
            ]),
        stack      : mk_stack<CoastlineControl>(),
        operations : mk_stack(
            pending_operation(cons_def, 2)
        ),
        results    : mk_stack(
            obj('Term', obj('TermAtom', 'a'))
        )
    },
    { // USER IS NOT SHOWN THIS STEP
        control    : operator_app(build_term_def, []),
        stack      : mk_stack<CoastlineControl>(
            operator_app(build_list_def, [])
        ),
        operations : mk_stack(
            pending_operation(cons_def, 2),
            pending_operation(cons_def, 2)
        ),
        results    : mk_stack(
            obj('Term', obj('TermAtom', 'a'))
        )
    },
    {
        control    :
            options_tree([
                ['atom',     () => req({ type: 'AtomName',   payload: undefined }, (name) => expect_string(name, ({ value }) => obj('Term', obj('TermAtom',     value))))],
                ['variable', () => req({ type: 'VariableId', payload: undefined }, (id)   => expect_string(id,   ({ value }) => obj('Term', obj('TermVariable', value))))],
                ['list',     () => operator_app(build_list_def, [])]
            ]),
        stack      : mk_stack<CoastlineControl>(
            operator_app(build_list_def, [])
        ),
        operations : mk_stack(
            pending_operation(cons_def, 2),
            pending_operation(cons_def, 2)
        ),
        results    : mk_stack(
            obj('Term', obj('TermAtom', 'a'))
        )
    },
    // choose 'atom'
    {
        control    : req({ type: 'AtomName', payload: undefined }, (name) => expect_string(name, ({ value }) => obj('Term', obj('TermAtom', value)))),
        stack      : mk_stack<CoastlineControl>(
            operator_app(build_list_def, [])
        ),
        operations : mk_stack(
            pending_operation(cons_def, 2),
            pending_operation(cons_def, 2)
        ),
        results    : mk_stack(
            obj('Term', obj('TermAtom', 'a'))
        )
    },
    // respond_with 'b'
    { // USER IS NOT SHOWN THIS STEP
        control    : obj('Term', obj('TermAtom', 'b')),
        stack      : mk_stack<CoastlineControl>(
            operator_app(build_list_def, [])
        ),
        operations : mk_stack(
            pending_operation(cons_def, 2),
            pending_operation(cons_def, 2)
        ),
        results    : mk_stack(
            obj('Term', obj('TermAtom', 'a'))
        )
    },
    { // USER IS NOT SHOWN THIS STEP
        control    : operator_app(build_list_def, []),
        stack      : mk_stack<CoastlineControl>(),
        operations : mk_stack(
            pending_operation(cons_def, 2),
            pending_operation(cons_def, 2)
        ),
        results    : mk_stack(
            obj('Term', obj('TermAtom', 'b')),
            obj('Term', obj('TermAtom', 'a'))
        )
    },
    {
        control    :
            options_tree([
                ['empty',     () => obj('Term', obj('TermList', []))],
                ['non_empty', () => operator_app(cons_def, [
                    operator_app(build_term_def, []),
                    operator_app(build_list_def, [])
                ])]
            ]),
        stack      : mk_stack<CoastlineControl>(),
        operations : mk_stack(
            pending_operation(cons_def, 2),
            pending_operation(cons_def, 2)
        ),
        results    : mk_stack(
            obj('Term', obj('TermAtom', 'b')),
            obj('Term', obj('TermAtom', 'a'))
        )
    },
    // choose 'empty'
    {
        control    : obj('Term', obj('TermList', [])),
        stack      : mk_stack<CoastlineControl>(),
        operations : mk_stack(
            pending_operation(cons_def, 2),
            pending_operation(cons_def, 2)
        ),
        results    : mk_stack(
            obj('Term', obj('TermAtom', 'b')),
            obj('Term', obj('TermAtom', 'a'))
        )
    },
    { // USER IS NOT SHOWN THIS STEP
        control    : undefined,
        stack      : mk_stack<CoastlineControl>(),
        operations : mk_stack(
            pending_operation(cons_def, 2),
            pending_operation(cons_def, 2)
        ),
        results    : mk_stack(
            obj('Term', obj('TermList', [])),
            obj('Term', obj('TermAtom', 'b')),
            obj('Term', obj('TermAtom', 'a'))
        )
    },
    { // USER IS NOT SHOWN THIS STEP
        control    : obj('TermList', [obj('Term', obj('TermAtom', 'b'))]),
        stack      : mk_stack<CoastlineControl>(),
        operations : mk_stack(
            pending_operation(cons_def, 2)
        ),
        results    : mk_stack(
            obj('Term', obj('TermAtom', 'a'))
        )
    },
    { // USER IS NOT SHOWN THIS STEP
        control    : undefined,
        stack      : mk_stack<CoastlineControl>(),
        operations : mk_stack(
            pending_operation(cons_def, 2)
        ),
        results    : mk_stack<AnyCoastlineObject>(
            obj('TermList', [obj('Term', obj('TermAtom', 'b'))]),
            obj('Term', obj('TermAtom', 'a'))
        )
    },
    { // USER IS NOT SHOWN THIS STEP
        control    : obj('Term', obj('TermList', [obj('Term', obj('TermAtom', 'a')), obj('Term', obj('TermAtom', 'b'))])),
        stack      : mk_stack<CoastlineControl>(),
        operations : mk_stack(),
        results    : mk_stack<AnyCoastlineObject>()
    },
    { // DONE!
        control    : undefined,
        stack      : mk_stack<CoastlineControl>(),
        operations : mk_stack(),
        results    : mk_stack<AnyCoastlineObject>(
            obj('Term', obj('TermList', [obj('Term', obj('TermAtom', 'a')), obj('Term', obj('TermAtom', 'b'))]))
        )
    }
]
*/

export const coastline_term_from_json = (json: any): CoastlineObject<'Term'> => {
    if (is_string(json))
        if (json[0] === '.')
            return obj('Term', obj('TermVariable', json.substring(1)))
        else
            return obj('Term', obj('TermAtom', json))
    if (is_array(json))
        return obj('Term', obj('TermList', json.map(coastline_term_from_json)))
    throw new Error
}

const str = object_constructor('String')
const trm = object_constructor('Term')
const atm = object_constructor('TermAtom')

describe('run_machine_with_script', () => {
    test('build_term a', () => expect(
        run_machine_with_script(
            start_machine(operator_app(build_term_def, [])),
            [choice('atom'), response(str('a'))]
        )
    ).toEqual(
        finished_machine(trm(atm('a')))
    ))
    test('build_term [a, b]', () => expect(
        run_machine_with_script(
            start_machine(operator_app(build_term_def, [])),
            [choice('list'), choice('non_empty'), choice('atom'), response(str('a')), choice('non_empty'), choice('atom'), response(str('b')), choice('empty')]
        )
    ).toEqual(
        finished_machine(coastline_term_from_json(['a', 'b']))
    ))
    test.only('build_term (a, (b, .x, (), c), d, (a))', () => expect(
        run_machine_with_script(
            start_machine(operator_app(build_term_def, [])),
            [choice('list'), choice('non_empty'), choice('atom'), response(str('a')), choice('non_empty'), choice('list'), choice('non_empty'), choice('atom'), response(str('b')), choice('non_empty'), choice('variable'), response(str('x')), choice('non_empty'), choice('list'), choice('empty'), choice('non_empty'), choice('atom'), response(str('c')), choice('empty'), choice('non_empty'), choice('atom'), response(str('d')), choice('non_empty'), choice('list'), choice('non_empty'), choice('atom'), response(str('a')), choice('empty'), choice('empty')]
        )
    ).toEqual(
        finished_machine(coastline_term_from_json(['a', ['b', '.x', [], 'c'], 'd', ['a']]))
    ))
})