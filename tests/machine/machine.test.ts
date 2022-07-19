import { CoastlineControl, display_coastline_control } from "../../src/machine/control"
import { err, is_coastline_error } from "../../src/machine/error"
import { apply_substitution_def_2, build_term_def, fib_def, NatOVM, TermEVM, TermOVM } from "../../src/machine/examples"
import { choice, display_coastline_machine, finished_machine, response, run_machine_with_script, start_machine } from '../../sr../../src/machine/machine'
import { AnyCoastlineObject, CoastlineObject, cta, display_coastline_object, is_coastline_object, obj, object_constructor } from "../../src/machine/object"
import { is_operator_app, OperatorApplication, OperatorDefinition, operator_app, operator_definition } from "../../src/machine/operator"
import { is_options_tree, OptionsTree, options_tree } from "../../src/machine/options_tree"
// import { AnyCoastlineRequest, is_coastline_request, req } from "../../src/machine/request"
import { expect_type } from "../../src/machine/utilities"
import { display_stack, is_empty_stack, is_non_empty_stack, mk_stack, pop_entry, possibly_pop_n_entries, push_entries, push_entry, Stack } from "../../src/stack"
import { defined, first, is_array, is_empty, is_string, rest } from "../../src/utilities"


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

const coastline_term_from_json = (json: any): CoastlineObject<TermOVM, 'TermAtom' | 'TermVariable' | 'TermList'> => {
    if (is_string(json))
        if (json[0] === '.')
            return obj('TermVariable', json.substring(1))
        else
            return obj('TermAtom', json)
    if (is_array(json))
        return obj('TermList', json.map(coastline_term_from_json))
    throw new Error
}

const str = object_constructor('String')
// const trm = object_constructor('Term')
const atm = object_constructor<TermOVM, 'TermAtom'>('TermAtom')
const va_ = object_constructor<TermOVM, 'TermVariable'>('TermVariable')
const nat = object_constructor<NatOVM, 'Natural_Number'>('Natural_Number')

const substitution = (...pairs: [CoastlineObject<TermOVM, 'TermVariable'>, CoastlineObject<TermOVM, 'TermAtom' | 'TermVariable' | 'TermList'>][]): CoastlineObject<TermOVM, 'EmptySub' | 'NonEmptySub'> => {
    if (is_empty(pairs))
        return obj('EmptySub', [])
    return obj('NonEmptySub', { variable: first(pairs)[0], term: first(pairs)[1], rest: substitution(...rest(pairs)) })
}

describe('run_machine_with_script', () => {
    test('build_term a', () => expect(
        run_machine_with_script(
            start_machine(operator_app(build_term_def, [])),
            [choice('atom'), response(str('a'))]
        )
    ).toEqual(
        finished_machine(atm('a'))
    ))
    test('build_term [a, b]', () => expect(
        run_machine_with_script(
            start_machine(operator_app(build_term_def, [])),
            [choice('list'), choice('non_empty'), choice('atom'), response(str('a')), choice('non_empty'), choice('atom'), response(str('b')), choice('empty')]
        )
    ).toEqual(
        finished_machine(coastline_term_from_json(['a', 'b']))
    ))
    test('build_term (a, (b, .x, (), c), d, (a))', () => expect(
        run_machine_with_script(
            start_machine(operator_app(build_term_def, [])),
            [choice('list'), choice('non_empty'), choice('atom'), response(str('a')), choice('non_empty'), choice('list'), choice('non_empty'), choice('atom'), response(str('b')), choice('non_empty'), choice('variable'), response(str('x')), choice('non_empty'), choice('list'), choice('empty'), choice('non_empty'), choice('atom'), response(str('c')), choice('empty'), choice('non_empty'), choice('atom'), response(str('d')), choice('non_empty'), choice('list'), choice('non_empty'), choice('atom'), response(str('a')), choice('empty'), choice('empty')]
        )
    ).toEqual(
        finished_machine(coastline_term_from_json(['a', ['b', '.x', [], 'c'], 'd', ['a']]))
    ))
    test('apply empty substitution to list of atoms and variables', () => expect(
        run_machine_with_script(
            start_machine(operator_app(apply_substitution_def_2, [
                substitution(),
                coastline_term_from_json(['.y', 'a', 'b', '.x', 'c'])
            ])),
            [choice('list'), choice('non_empty'), choice('variable'), choice('empty_sub'), choice('non_empty'), choice('atom'), choice('non_empty'), choice('atom'), choice('non_empty'), choice('variable'), choice('empty_sub'), choice('non_empty'), choice('atom'), choice('empty')]
        )
    ).toEqual(
        finished_machine(coastline_term_from_json(['.y', 'a', 'b', '.x', 'c']))
    ))
    // test('apply non-empty substitution to list that doesn\'t contain the relevant variables', () => expect(
    //     run_machine_with_script(
    //         start_machine(operator_app(apply_substitution_def_2, [
    //             substitution([va_('y'), atm('b')], [va_('z'), atm('d')]),
    //             coastline_term_from_json(['a', ['b', '.x', [], 'c'], 'd', ['a']])
    //         ])),
    //         [choice('non_empty_sub'), choice('list'), choice('list_is_not_empty'), choice('non_empty_sub'), choice('atom')]
    //     )
    // ).toEqual(
    //     finished_machine(coastline_term_from_json(['a', ['b', '.x', [], 'c'], 'd', ['a']]))
    // ))
    test('6th fibonacci number', () => expect(
        run_machine_with_script(
            start_machine(operator_app(fib_def, [nat(6)])),
            [
                choice('ge_two'),
                choice('ge_two'),
                choice('ge_two'),
                choice('zero'),
                choice('one'),
                choice('ge_two'),
                choice('one'),
                choice('ge_two'),
                choice('zero'),
                choice('one'),
                choice('ge_two'),
                choice('ge_two'),
                choice('one'),
                choice('ge_two'),
                choice('zero'),
                choice('one'),
                choice('ge_two'),
                choice('ge_two'),
                choice('zero'),
                choice('one'),
                choice('ge_two'),
                choice('one'),
                choice('ge_two'),
                choice('zero'),
                choice('one')
            ]
        )
    ).toEqual(
        finished_machine(nat(8))
    ))
    test('3rd fibonacci number', () => expect(
        run_machine_with_script(
            start_machine(operator_app(fib_def, [nat(3)])),
            [
                choice('ge_two'),
                choice('one'),
                choice('ge_two'),
                choice('zero'),
                choice('one')
            ]
        )
    ).toEqual(
        finished_machine(nat(2))
    ))
    test('apply substitution to list, changing all values', () => expect(
        run_machine_with_script(
            start_machine(operator_app(apply_substitution_def_2, [
                substitution([va_('x'), atm('a')], [va_('y'), atm('b')], [va_('z'), atm('c')]),
                coastline_term_from_json(['.z', '.y', '.x'])
            ])),
            [
                choice('list'),
                choice('non_empty'),
                choice('variable'),
                choice('first_substitution_does_not_equal_variable'),
                choice('first_substitution_does_not_equal_variable'),
                choice('first_substitution_equals_variable'),
                choice('non_empty'),
                choice('variable'),
                choice('first_substitution_does_not_equal_variable'),
                choice('first_substitution_equals_variable'),
                choice('non_empty'),
                choice('variable'),
                choice('first_substitution_equals_variable'),
                choice('empty')
            ]
        )
    ).toEqual(
        finished_machine(coastline_term_from_json(['c', 'b', 'a']))
    ))
})