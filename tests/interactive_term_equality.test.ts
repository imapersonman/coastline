import { Input, run_interaction } from "../src/interaction/interaction"
import { display_stack, mk_stack } from "../src/stack"
import { defined, first, is_empty, rest } from "../src/utilities"
import { CombinedTransitionResult, combined_transition_result, transition_result, transition_error, TransitionFunction, Frame, FrameMachineState, operation, mk_frame_machine, result_of, any_id_1 } from './frame_machine'
import { test_partial_generator_expectation } from "./generators/check_generator"

class TermAtom {
    constructor(
        readonly label: string
    ) {}
}

const atom = (label: string): TermAtom => new TermAtom(label)
const atoms = (...labels: string[]): TermAtom[] => labels.map(atom)
const is_atom = (a: unknown): a is TermAtom => a instanceof TermAtom
const atoms_equal = (a1: TermAtom, a2: TermAtom): boolean => a1.label === a2.label
const display_atom = (a: TermAtom) => a.label

class TermVariable {
    constructor(
        readonly id: string
    ) {}
}

const variable = (label: string): TermVariable => new TermVariable(label)
const variables = (...ids: string[]): TermVariable[] => ids.map(variable)
const is_variable = (a: unknown): a is TermVariable => a instanceof TermVariable
const variables_equal = (v1: TermVariable, v2: TermVariable): boolean => v1.id === v2.id
const display_variable = (v: TermVariable) => v.id

class TermList {
    constructor(
        readonly terms: Term[]
    ) {}
}

const list = (...terms: Term[]): TermList => new TermList(terms)
const is_list = (l: unknown): l is TermList => l instanceof TermList
const lists_equal = (l1: TermList, l2: TermList): boolean => {
    if (is_empty(l1.terms))
        return is_empty(l2.terms)
    if (is_empty(l2.terms))
        return false
    return terms_equal(first(l1.terms), first(l2.terms)) && terms_equal(list(...rest(l1.terms)), list(...rest(l2.terms)))
}
const display_list = (l: TermList) => `(${l.terms.map(display_term).join(' ')})`

type Term = TermAtom | TermVariable | TermList
type TermType = 'Atom' | 'Variable' | 'List'
const display_term = (t: Term) => {
    if (is_atom(t))
        return display_atom(t)
    if (is_variable(t))
        return display_variable(t)
    if (is_list(t))
        return display_list(t)
    return '??????????'
}

const type_of_term = (term: Term): TermType =>
    is_atom(term) ? 'Atom'
    : is_variable(term) ? 'Variable'
    : 'List'

// REFERENCE IMPLEMENTATION
const terms_equal = (t1: Term, t2: Term): boolean => {
    // We wait until a clause has been selected
    if (is_atom(t1) && is_atom(t2))
        // Once a clause has been selected, we are running with the selected clause
        return atoms_equal(t1, t2)
    if (is_variable(t1) && is_variable(t2))
        return variables_equal(t1, t2)
    if (is_list(t1) && is_list(t2))
        return lists_equal(t1, t2)
    return false
}

const b_id_1 = ([r]: boolean[]): boolean => r
const b_not_1 = ([r]: boolean[]): boolean => !r
const b_and_n = (rs: boolean[]): boolean => rs.every((r) => r)

type TE<T extends Term> = { left: T, right: T }
const display_term_equation = (e: TE<Term>) => `${display_term(e.left)} = ${display_term(e.right)}`

// 1) Create Frame Map
// 2) Create Request Map
// 3) Specity possible errors
// 4) Specity possible results
// 5) Write initial_frame function
// 6) Write the TransitionFunction

type TEFrameMap = {
    'terms_equal_frame'     : { input: TE<Term>, transition_ids: 'atoms' | 'variables' | 'lists' }
    'atoms_equal_frame'     : { input: TE<TermAtom>, transition_ids: 'atoms_equal' | 'atoms_not_equal' }
    'variables_equal_frame' : { input: TE<TermVariable>, transition_ids: 'variables_equal' | 'variables_not_equal' }
    'lists_equal_frame'     : { input: TE<TermList>, transition_ids: 'lists_empty' | 'lists_left_empty_right_non_empty' | 'lists_left_non_empty_right_empty' | 'lists_non_empty' }
}

type TEFrame = Frame<TEFrameMap>

type TEError =
    | 'left_or_right_is_not_atom'
    | 'left_or_right_is_not_variable'
    | 'left_or_right_is_not_list'
    | 'atoms_should_be_equal'
    | 'atoms_should_not_be_equal'
    | 'variables_should_be_equal'
    | 'variables_should_not_be_equal'
    | 'list_lengths_should_be_zero'
    | 'lists_left_should_be_empty_and_right_should_be_non_empty'
    | 'lists_left_should_be_non_empty_and_right_should_be_empty'
    | 'lists_should_be_non_empty'

const display_error = (e: TEError) => e

type TermsEqualState = FrameMachineState<TE<Term>, TEFrameMap, TEError, boolean>

const display_frame = (frame: TEFrame) => ({ ...frame, left: display_term(frame.value.left), right: display_term(frame.value.right) })

const display_terms_equal_state = (state: TermsEqualState) => ({
    initial_input: defined(state.initial_input) ? display_term_equation(state.initial_input) : 'undefined',
    frame_stack: display_stack(state.frame_stack, display_frame),
    operation_stack: display_stack(state.operation_stack),
    result_stack: display_stack(state.result_stack),
    error: defined(state.error) ? display_error(state.error) : 'undefined'
})

type TERequestMap = { [id: string]: { payload: undefined, response: undefined } }

const run_frame_transition: TransitionFunction<TEFrameMap, TERequestMap, TEError, boolean> = (frame, transition_id) => {
    if (frame.type === 'terms_equal_frame') {
        const { left, right } = frame.value
        if (transition_id === 'atoms') {
            if (!is_atom(left) || !is_atom(right))
                return transition_error('left_or_right_is_not_atom')
            return result_of({ type: 'atoms_equal_frame', value: { left, right } })
        } else if (transition_id === 'variables') {
            if (!is_variable(left) || !is_variable(right))
                return transition_error('left_or_right_is_not_variable')
            return result_of({ type: 'variables_equal_frame', value: { left, right } })
        } else if (transition_id === 'lists') {
            if (!is_list(left) || !is_list(right))
                return transition_error('left_or_right_is_not_list')
            return result_of({ type: 'lists_equal_frame', value: { left, right } })
        }
    } else if (frame.type === 'atoms_equal_frame') {
        const { left, right } = frame.value
        if (transition_id === 'atoms_equal') {
            if (left.label !== right.label)
                return transition_error('atoms_should_be_equal')
            return transition_result(true)
        } else if (transition_id === 'atoms_not_equal') {
            if (left.label === right.label)
                return transition_error('atoms_should_not_be_equal')
            return transition_result(false)
        }
    } else if (frame.type === 'variables_equal_frame') {
        const { left, right } = frame.value
        if (transition_id === 'variables_equal') {
            if (left.id !== right.id)
                return transition_error('variables_should_be_equal')
            return transition_result(true)
        } else if (transition_id === 'variables_not_equal') {
            if (left.id === right.id)
                return transition_error('variables_should_not_be_equal')
            return transition_result(false)
        }
    } else if (frame.type === 'lists_equal_frame') {
        const { left, right } = frame.value
        if (transition_id === 'lists_empty') {
            if (left.terms.length !== 0 || right.terms.length !== 0)
                return transition_error('list_lengths_should_be_zero')
            return transition_result(true)
        } else if (transition_id === 'lists_left_empty_right_non_empty') {
            if (left.terms.length !== 0 || right.terms.length === 0)
                return transition_error('lists_left_should_be_empty_and_right_should_be_non_empty')
            return transition_result(false)
        } else if (transition_id === 'lists_left_non_empty_right_empty') {
            if (left.terms.length === 0 || right.terms.length !== 0)
                return transition_error('lists_left_should_be_non_empty_and_right_should_be_empty')
            return transition_result(false)
        } else if (transition_id === 'lists_non_empty') {
            if (left.terms.length === 0 || right.terms.length === 0)
                return transition_error('lists_should_be_non_empty')
            return combined_transition_result(b_and_n, [
                { type: 'terms_equal_frame', value: { left: first(left.terms),         right: first(right.terms)         } },
                { type: 'terms_equal_frame', value: { left: list(...rest(left.terms)), right: list(...rest(right.terms)) } }
            ])
        }
    }
    throw new Error(`Unrecognized (frame type, transition id): (${frame.type}, ${transition_id})`)
}

const initial_frame_from_initial_input = (ii: TE<Term>): TEFrame => ({ type: 'terms_equal_frame', value: ii })

const term_equality_interaction = mk_frame_machine(initial_frame_from_initial_input, run_frame_transition)
const [a, b, c] = atoms('a', 'b', 'c')

describe('(a b) = (a c)', () => {
    test_partial_generator_expectation('', run_interaction(term_equality_interaction), {
        yields: [
            {
                yielded: {
                    initial_input: undefined,
                    current_frame: undefined,
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(),
                    result_stack: mk_stack(),
                    error: undefined,
                    // tree: undefined
                },
                continued_with: Input({ type: 'InitialInput', value: { left: list(a, b), right: list(a, c) } })
            },
            {
                yielded: {
                    initial_input: { left: list(a, b), right: list(a, c) },
                    current_frame: { type: 'terms_equal_frame', value: { left: list(a, b), right: list(a, c) } },
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(),
                    result_stack: mk_stack(),
                    error: undefined,
                    // tree:
                    //     current<TEFrame>({ type: 'terms_equal_frame', value: { left: list(a, b), right: list(a, c) } })
                },
                continued_with: Input({ type: 'Tactic', value: 'lists' })
            },
            {
                yielded: {
                    initial_input: { left: list(a, b), right: list(a, c) },
                    current_frame: { type: 'lists_equal_frame', value: { left: list(a, b), right: list(a, c) } },
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(),
                    error: undefined,
                    // tree:
                    //     running({ type: 'terms_equal_frame', value: { left: list(a, b), right: list(a, c) } }, 'lists', [
                    //         current<TEFrame>({ type: 'lists_equal_frame', value: { left: list(a, b), right: list(a, c) } })
                        // ])
                },
                continued_with: Input({ type: 'Tactic', value: 'lists_non_empty' })
            },
            {
                yielded: {
                    initial_input: { left: list(a, b), right: list(a, c) },
                    current_frame: { type: 'terms_equal_frame', value: { left: a, right: a } },
                    frame_stack: mk_stack(
                        { type: 'terms_equal_frame', value: { left: list(b), right: list(c) } }
                    ),
                    operation_stack: mk_stack(
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(),
                    error: undefined,
                    // tree:
                    //     running({ type: 'terms_equal_frame', value: { left: list(a, b), right: list(a, c) } }, 'lists', [
                    //         running({ type: 'lists_equal_frame', value: { left: list(a, b), right: list(a, c) } }, 'lists_non_empty', [
                    //             current<TEFrame>({ type: 'terms_equal_frame', value: { left: a, right: a } }),
                    //             waiting<TEFrame>({ type: 'terms_equal_frame', value: { left: list(b), right: list(c) } })
                    //         ])
                    //     ])
                },
                continued_with: Input({ type: 'Tactic', value: 'atoms' })
            },
            {
                yielded: {
                    initial_input: { left: list(a, b), right: list(a, c) },
                    current_frame: { type: 'atoms_equal_frame', value: { left: a, right: a } },
                    frame_stack: mk_stack(
                        { type: 'terms_equal_frame', value: { left: list(b), right: list(c) } }
                    ),
                    operation_stack: mk_stack(
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(),
                    error: undefined,
                    // tree:
                    //     running({ type: 'terms_equal_frame', value: { left: list(a, b), right: list(a, c) } }, 'lists', [
                    //         running({ type: 'lists_equal_frame', value: { left: list(a, b), right: list(a, c) } }, 'lists_non_empty', [
                    //             running({ type: 'terms_equal_frame', value: { left: a, right: a } }, 'atoms', [
                    //                 current<TEFrame>({ type: 'atoms_equal_frame', value: { left: a, right: a } })
                    //             ]),
                    //             waiting<TEFrame>({ type: 'terms_equal_frame', value: { left: list(b), right: list(c) } })
                    //         ])
                    //     ])
                },
                continued_with: Input({ type: 'Tactic', value: 'atoms_equal' })
            },
            {
                yielded: {
                    initial_input: { left: list(a, b), right: list(a, c) },
                    current_frame: { type: 'terms_equal_frame', value: { left: list(b), right: list(c) } },
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        true
                    ),
                    error: undefined,
                    // tree:
                    //     running({ type: 'terms_equal_frame', value: { left: list(a, b), right: list(a, c) } }, 'lists', [
                    //         running({ type: 'lists_equal_frame', value: { left: list(a, b), right: list(a, c) } }, 'lists_non_empty', [
                    //             finished<TEFrame, TETransitionIDs, boolean>({ type: 'terms_equal_frame', value: { left: a, right: a } }, 'atoms', true, [
                    //                 finished<TEFrame, TETransitionIDs, boolean>({ type: 'atoms_equal_frame', value: { left: a, right: a } }, 'atoms_equal', true, [])
                    //             ]),
                    //             current<TEFrame>({ type: 'terms_equal_frame', value: { left: list(b), right: list(c) } })
                    //         ])
                    //     ])
                },
                continued_with: Input({ type: 'Tactic', value: 'lists' })
            },
            {
                yielded: {
                    initial_input: { left: list(a, b), right: list(a, c) },
                    current_frame: { type: 'lists_equal_frame', value: { left: list(b), right: list(c) } },
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        true
                    ),
                    error: undefined,
                    // tree:
                    //     running({ type: 'terms_equal_frame', value: { left: list(a, b), right: list(a, c) } }, 'lists', [
                    //         running({ type: 'lists_equal_frame', value: { left: list(a, b), right: list(a, c) } }, 'lists_non_empty', [
                    //             finished<TEFrame, TransitionIDs, Result>({ type: 'terms_equal_frame', value: { left: a, right: a } }, 'atoms', true, [
                    //                 finished<TEFrame, TransitionIDs, Result>({ type: 'atoms_equal_frame', value: { left: a, right: a } }, 'atoms_equal', true, [])
                    //             ]),
                    //             running({ type: 'terms_equal_frame', value: { left: list(b), right: list(c) } }, 'lists', [
                    //                 current({ type: 'lists_equal_frame', value: { left: list(b), right: list(c) } })
                    //             ])
                    //         ])
                    //     ])
                },
                continued_with: Input({ type: 'Tactic', value: 'lists_non_empty' })
            },
            {
                yielded: {
                    initial_input: { left: list(a, b), right: list(a, c) },
                    current_frame: { type: 'terms_equal_frame', value: { left: b, right: c } },
                    frame_stack: mk_stack(
                        { type: 'terms_equal_frame', value: { left: list(), right: list() } }
                    ),
                    operation_stack: mk_stack(
                        operation(2, b_and_n),
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        true
                    ),
                    error: undefined,
                    // tree:
                    //     running({ type: 'terms_equal_frame', value: { left: list(a, b), right: list(a, c) } }, 'lists', [
                    //         running({ type: 'lists_equal_frame', value: { left: list(a, b), right: list(a, c) } }, 'lists_non_empty', [
                    //             running({ type: 'terms_equal_frame', value: { left: a, right: a } }, 'atoms', true, [
                    //                 finished({ type: 'atoms_equal_frame', value: { left: a, right: a } }, 'atoms_equal', true)
                    //             ]),
                    //             running({ type: 'terms_equal_frame', value: { left: list(b), right: list(c) } }, 'lists', [
                    //                 running({ type: 'lists_equal_frame', value: { left: list(b), right: list(c) } }, 'lists_non_empty', [
                    //                     current({ type: 'terms_equal_frame', value: { left: b, right: c } }),
                    //                     waiting({ type: 'terms_equal_frame', value: { left: list(), right: list() } })
                    //                 ])
                    //             ])
                    //         ])
                    //     ])
                },
                continued_with: Input({ type: 'Tactic', value: 'atoms' })
            },
            {
                yielded: {
                    initial_input: { left: list(a, b), right: list(a, c) },
                    current_frame: { type: 'atoms_equal_frame', value: { left: b, right: c } },
                    frame_stack: mk_stack(
                        { type: 'terms_equal_frame', value: { left: list(), right: list() } }
                    ),
                    operation_stack: mk_stack(
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        true
                    ),
                    error: undefined,
                    // tree:
                    //     running({ type: 'terms_equal_frame', value: { left: list(a, b), right: list(a, c) } }, 'lists', [
                    //         running({ type: 'lists_equal_frame', value: { left: list(a, b), right: list(a, c) } }, 'lists_non_empty', [
                    //             running({ type: 'terms_equal_frame', value: { left: a, right: a } }, 'atoms', true, [
                    //                 finished({ type: 'atoms_equal_frame', value: { left: a, right: a } }, 'atoms_equal', true)
                    //             ]),
                    //             running({ type: 'terms_equal_frame', value: { left: list(b), right: list(c) } }, 'lists', [
                    //                 running({ type: 'lists_equal_frame', value: { left: list(b), right: list(c) } }, 'lists_non_empty', [
                    //                     running({ type: 'terms_equal_frame', value: { left: b, right: c } }, 'atoms', [
                    //                         current({ type: 'atoms_equal_frame', value: { left: b, right: c } })
                    //                     ]),
                    //                     waiting({ type: 'terms_equal_frame', value: { left: list(), right: list() } })
                    //                 ])
                    //             ])
                    //         ])
                    //     ])
                },
                continued_with: Input({ type: 'Tactic', value: 'atoms_not_equal' })
            },
            {
                yielded: {
                    initial_input: { left: list(a, b), right: list(a, c) },
                    current_frame: { type: 'terms_equal_frame', value: { left: list(), right: list() } },
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        false
                    ),
                    error: undefined,
                    // tree:
                    //     running({ type: 'terms_equal_frame', value: { left: list(a, b), right: list(a, c) } }, 'lists', [
                    //         running({ type: 'lists_equal_frame', value: { left: list(a, b), right: list(a, c) } }, 'lists_non_empty', [
                    //             running({ type: 'terms_equal_frame', value: { left: a, right: a } }, 'atoms', true, [
                    //                 finished({ type: 'atoms_equal_frame', value: { left: a, right: a } }, 'atoms_equal', true)
                    //             ]),
                    //             running({ type: 'terms_equal_frame', value: { left: list(b), right: list(c) } }, 'lists', [
                    //                 running({ type: 'lists_equal_frame', value: { left: list(b), right: list(c) } }, 'lists_non_empty', [
                    //                     finished({ type: 'terms_equal_frame', value: { left: b, right: c } }, 'atoms', false, [
                    //                         finished({ type: 'atoms_equal_frame', value: { left: b, right: c } }, false)
                    //                     ]),
                    //                     current({ type: 'terms_equal_frame', value: { left: list(), right: list() } })
                    //                 ])
                    //             ])
                    //         ])
                    //     ])
                },
                continued_with: Input({ type: 'Tactic', value: 'lists' }),
            },
            {
                yielded: {
                    initial_input: { left: list(a, b), right: list(a, c) },
                    current_frame: { type: 'lists_equal_frame', value: { left: list(), right: list() } },
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        false
                    ),
                    error: undefined,
                    // tree:
                    //     running({ type: 'terms_equal_frame', value: { left: list(a, b), right: list(a, c) } }, 'lists', [
                    //         running({ type: 'lists_equal_frame', value: { left: list(a, b), right: list(a, c) } }, 'lists_non_empty', [
                    //             running({ type: 'terms_equal_frame', value: { left: a, right: a } }, 'atoms', true, [
                    //                 finished({ type: 'atoms_equal_frame', value: { left: a, right: a } }, 'atoms_equal', true)
                    //             ]),
                    //             running({ type: 'terms_equal_frame', value: { left: list(b), right: list(c) } }, 'lists', [
                    //                 running({ type: 'lists_equal_frame', value: { left: list(b), right: list(c) } }, 'lists_non_empty', [
                    //                     finished({ type: 'terms_equal_frame', value: { left: b, right: c } }, 'atoms', false, [
                    //                         finished({ type: 'atoms_equal_frame', value: { left: b, right: c } }, false)
                    //                     ]),
                    //                     running({ type: 'terms_equal_frame', value: { left: list(), right: list() } }, 'lists', [
                    //                         current({ type: 'lists_equal_frame', value: { left: list(), right: list() } })
                    //                     ])
                    //                 ])
                    //             ])
                    //         ])
                    //     ])
                },
                continued_with: Input({ type: 'Tactic', value: 'lists_empty' })
            }
        ],
        returns: {
            initial_input: { left: list(a, b), right: list(a, c) },
            current_frame: undefined,
            frame_stack: mk_stack(),
            operation_stack: mk_stack(),
            result_stack: mk_stack(
                false
            ),
            error: undefined,
            // tree:
            //     finished({ type: 'terms_equal_frame', value: { left: list(a, b), right: list(a, c) } }, 'lists', false, [
            //         finished({ type: 'lists_equal_frame', value: { left: list(a, b), right: list(a, c) } }, 'lists_non_empty', false, [
            //             finished({ type: 'terms_equal_frame', value: { left: a, right: a } }, 'atoms', true, [
            //                 finished({ type: 'atoms_equal_frame', value: { left: a, right: a } }, 'atoms_equal', true)
            //             ]),
            //             finished({ type: 'terms_equal_frame', value: { left: list(b), right: list(c) } }, 'lists', false, [
            //                 finished({ type: 'lists_equal_frame', value: { left: list(b), right: list(c) } }, 'lists_non_empty', false, [
            //                     finished({ type: 'terms_equal_frame', value: { left: b, right: c } }, 'atoms', false, [
            //                         finished({ type: 'atoms_equal_frame', value: { left: b, right: c } }, false)
            //                     ]),
            //                     finished({ type: 'terms_equal_frame', value: { left: list(), right: list() } }, 'lists', true, [
            //                         finished({ type: 'lists_equal_frame', value: { left: list(), right: list() } }, 'lists_empty', true, [])
            //                     ])
            //                 ])
            //             ])
            //         ])
            //     ])
        }
    }, display_terms_equal_state, display_terms_equal_state)
})

describe('() = (a)', () => {
    test_partial_generator_expectation('', run_interaction(term_equality_interaction), {
        yields: [
            {
                yielded: {
                    initial_input: undefined,
                    current_frame: undefined,
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(),
                    result_stack: mk_stack(),
                    error: undefined
                },
                continued_with: Input({ type: 'InitialInput', value: { left: list(), right: list(a) } })
            },
            {
                yielded: {
                    initial_input: { left: list(), right: list(a) },
                    current_frame: { type: 'terms_equal_frame', value: { left: list(), right: list(a) } },
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(),
                    result_stack: mk_stack(),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'lists' })
            },
            {
                yielded: {
                    initial_input: { left: list(), right: list(a) },
                    current_frame: { type: 'lists_equal_frame', value: { left: list(), right: list(a) } },
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'lists_left_empty_right_non_empty' })
            }
        ],
        returns: {
            initial_input: { left: list(), right: list(a) },
            current_frame: undefined,
            frame_stack: mk_stack(),
            operation_stack: mk_stack(),
            result_stack: mk_stack(
                false
            ),
            error: undefined
        }
    }, display_terms_equal_state, display_terms_equal_state)
})

describe('(a) = ()', () => {
    test_partial_generator_expectation('', run_interaction(term_equality_interaction), {
        yields: [
            {
                yielded: {
                    initial_input: undefined,
                    current_frame: undefined,
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(),
                    result_stack: mk_stack(),
                    error: undefined
                },
                continued_with: Input({ type: 'InitialInput', value: { left: list(a), right: list() } })
            },
            {
                yielded: {
                    initial_input: { left: list(a), right: list() },
                    current_frame: { type: 'terms_equal_frame', value: { left: list(a), right: list() } },
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(),
                    result_stack: mk_stack(),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'lists' })
            },
            {
                yielded: {
                    initial_input: { left: list(a), right: list() },
                    current_frame: { type: 'lists_equal_frame', value: { left: list(a), right: list() } },
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(
                        operation(1, any_id_1)
                    ),
                    result_stack: mk_stack(),
                    error: undefined,
                },
                continued_with: Input({ type: 'Tactic', value: 'lists_left_non_empty_right_empty' })
            }
        ],
        returns: {
            initial_input: { left: list(a), right: list() },
            current_frame: { type: 'lists_equal_frame', value: { left: list(a), right: list() } },
            frame_stack: mk_stack(),
            operation_stack: mk_stack(),
            result_stack: mk_stack(
                false
            ),
            error: undefined
        }
    })
})

describe('((a b) c ()) = ((a b) c (a))', () => {
    test_partial_generator_expectation('', run_interaction(term_equality_interaction), {
        yields: [
            { // 0
                yielded: {
                    initial_input: undefined,
                    current_frame: undefined,
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(),
                    result_stack: mk_stack(),
                    error: undefined
                },
                continued_with: Input({ type: 'InitialInput', value: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) } })
            },
            { // 1
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'terms_equal_frame', value: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) } },
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(),
                    result_stack: mk_stack(),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'lists' })
            },
            { // 2
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'lists_equal_frame', value: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) } },
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'lists_non_empty' })
            },
            { // 3
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'terms_equal_frame', value: { left: list(a, b), right: list(a, b) } },
                    frame_stack: mk_stack(
                        { type: 'terms_equal_frame', value: { left: list(c, list()), right: list(c, list(a)) } }
                    ),
                    operation_stack: mk_stack(
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'lists' })
            },
            { // 4
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) } ,
                    current_frame: { type: 'lists_equal_frame', value: { left: list(a, b), right: list(a, b) } },
                    frame_stack: mk_stack(
                        { type: 'terms_equal_frame', value: { left: list(c, list()), right: list(c, list(a)) } }
                    ),
                    operation_stack: mk_stack(
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'lists_non_empty' })
            },
            { // 5
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'terms_equal_frame', value: { left: a, right: a } },
                    frame_stack: mk_stack(
                        { type: 'terms_equal_frame', value: { left: list(b), right: list(b) } },
                        { type: 'terms_equal_frame', value: { left: list(c, list()), right: list(c, list(a)) } }
                    ),
                    operation_stack: mk_stack(
                        operation(2, b_and_n),
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'atoms' })
            },
            { // 6
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'atoms_equal_frame', value: { left: a, right: a } },
                    frame_stack: mk_stack(
                        { type: 'terms_equal_frame', value: { left: list(b), right: list(b) } },
                        { type: 'terms_equal_frame', value: { left: list(c, list()), right: list(c, list(a)) } }
                    ),
                    operation_stack: mk_stack(
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'atoms_equal' })
            },
            // Just had an annoying thought:
            // - I don't think the way I'm doing the frame, operation, and result stack is currently working.
            // - Imma keep working through this example while thinking about it.
            { // 7
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'terms_equal_frame', value: { left: list(b), right: list(b) } },
                    frame_stack: mk_stack(
                        { type: 'terms_equal_frame', value: { left: list(c, list()), right: list(c, list(a)) } }
                    ),
                    operation_stack: mk_stack(
                        operation(2, b_and_n),
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        true
                    ),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'lists' })
            },
            { // 8
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'lists_equal_frame', value: { left: list(b), right: list(b) } },
                    frame_stack: mk_stack(
                        { type: 'terms_equal_frame', value: { left: list(c, list()), right: list(c, list(a)) } }
                    ),
                    operation_stack: mk_stack(
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        true
                    ),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'lists_non_empty' })
            },
            { // 9
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'terms_equal_frame', value: { left: b, right: b } },
                    frame_stack: mk_stack(
                        { type: 'terms_equal_frame', value: { left: list(), right: list() } },
                        { type: 'terms_equal_frame', value: { left: list(c, list()), right: list(c, list(a)) } }
                    ),
                    operation_stack: mk_stack(
                        operation(2, b_and_n),
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        true
                    ),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'atoms' })
            },
            { // 10
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'atoms_equal_frame', value: { left: b, right: b } },
                    frame_stack: mk_stack(
                        { type: 'terms_equal_frame', value: { left: list(), right: list() } },
                        { type: 'terms_equal_frame', value: { left: list(c, list()), right: list(c, list(a)) } }
                    ),
                    operation_stack: mk_stack(
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        true
                    ),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'atoms_equal' })
            },
            { // 11
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'terms_equal_frame', value: { left: list(), right: list() } },
                    frame_stack: mk_stack(
                        { type: 'terms_equal_frame', value: { left: list(c, list()), right: list(c, list(a)) } }
                    ),
                    operation_stack: mk_stack(
                        operation(2, b_and_n),
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        true
                    ),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'lists' })
            },
            { // 12
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'lists_equal_frame', value: { left: list(), right: list() } },
                    frame_stack: mk_stack(
                        { type: 'terms_equal_frame', value: { left: list(c, list()), right: list(c, list(a)) } }
                    ),
                    operation_stack: mk_stack(
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        true
                    ),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'lists_empty' })
            },
            { // 13
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'terms_equal_frame', value: { left: list(c, list()), right: list(c, list(a)) } },
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        true
                    ),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'lists' })
            },
            { // 14
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'lists_equal_frame', value: { left: list(c, list()), right: list(c, list(a)) } },
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        true
                    ),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'lists_non_empty' })
            },
            { // 15
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'terms_equal_frame', value: { left: c, right: c } },
                    frame_stack: mk_stack(
                        { type: 'terms_equal_frame', value: { left: list(list()), right: list(list(a)) } }
                    ),
                    operation_stack: mk_stack(
                        operation(2, b_and_n),
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        true
                    ),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'atoms' })
            },
            { // 16
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'atoms_equal_frame', value: { left: c, right: c } },
                    frame_stack: mk_stack(
                        { type: 'terms_equal_frame', value: { left: list(list()), right: list(list(a)) } }
                    ),
                    operation_stack: mk_stack(
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        true
                    ),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'atoms_equal' })
            },
            { // 17
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'terms_equal_frame', value: { left: list(list()), right: list(list(a)) } },
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        true
                    ),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'lists' })
            },
            { // 18
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'lists_equal_frame', value: { left: list(list()), right: list(list(a)) } },
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        true
                    ),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'lists_non_empty' })
            },
            { // 19
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'terms_equal_frame', value: { left: list(), right: list(a) } },
                    frame_stack: mk_stack(
                        { type: 'terms_equal_frame', value: { left: list(), right: list() } }
                    ),
                    operation_stack: mk_stack(
                        operation(2, b_and_n),
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        true
                    ),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'lists' })
            },
            { // 20
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'lists_equal_frame', value: { left: list(), right: list(a) } },
                    frame_stack: mk_stack(
                        { type: 'terms_equal_frame', value: { left: list(), right: list() } }
                    ),
                    operation_stack: mk_stack(
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        true
                    ),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'lists_left_empty_right_non_empty' })
            },
            { // 21
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'terms_equal_frame', value: { left: list(), right: list() } },
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        false
                    ),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'lists' })
            },
            { // 22
                yielded: {
                    initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
                    current_frame: { type: 'lists_equal_frame', value: { left: list(), right: list() } },
                    frame_stack: mk_stack(),
                    operation_stack: mk_stack(
                        operation(1, b_id_1),
                        operation(2, b_and_n),
                        operation(1, b_id_1)
                    ),
                    result_stack: mk_stack(
                        false
                    ),
                    error: undefined
                },
                continued_with: Input({ type: 'Tactic', value: 'lists_empty' })
            }
        ],
        returns: {
            initial_input: { left: list(list(a, b), c, list()), right: list(list(a, b), c, list(a)) },
            current_frame: undefined,
            frame_stack: mk_stack(),
            operation_stack: mk_stack(),
            result_stack: mk_stack(
                false
            ),
            error: undefined
        }
    }, display_terms_equal_state, display_terms_equal_state)
})