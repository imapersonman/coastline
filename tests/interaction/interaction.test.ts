/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { last, is_string, is_empty } from '../../src/utilities'
import { test_generator_expectation, test_partial_generator_expectation } from '../generators/check_generator'
import { Continue, ContinueThen, ForgetfulUndo, Input, Interaction, Redo, Retry, RunnableInteraction, RunSerially, run_interaction, SaveThen, StartInteraction, Undo, Update, UserInput, WaitFor, While } from '../../src/interaction/interaction'

const just_set_to_0: RunnableInteraction<number, undefined> =
    StartInteraction(
        -10,
        Update(() => 0)
    )
test_generator_expectation('just set to 0', run_interaction(just_set_to_0), {
    yields: [],
    returns: 0
})
const just_add_10: RunnableInteraction<number, undefined> =
    StartInteraction(
        -4,
        Update((value) => value + 10)
    )
test_generator_expectation('just add 10', run_interaction(just_add_10), {
    yields: [],
    returns: 6
})
const add_10_then_subtract_4: RunnableInteraction<number, undefined> =
    StartInteraction(
        -11,
        RunSerially([
            Update((value) => value + 10),
            Update((value) => value - 4)
        ])
    )
test_generator_expectation('just add 10 then subtract 4', run_interaction(add_10_then_subtract_4), {
    yields: [],
    returns: -5
})
const wait_for_new_string: RunnableInteraction<string, string> =
    StartInteraction(
        'cool',
        WaitFor(UserInput((state, input) => is_string(input) ? Continue(input) : Retry(state)))
    )
test_generator_expectation('wait for new string', run_interaction(wait_for_new_string), {
    yields: [
        { yielded: 'cool', continued_with: Input('beans') }
    ],
    returns: 'beans'
})
const concat_string_input: RunnableInteraction<string, number | string> =
    StartInteraction(
        'cool',
        WaitFor(UserInput((state, input) => is_string(input) ? Continue(state + input) : Retry('bad ' + state)))
    )
test_generator_expectation('concat string input', run_interaction(concat_string_input), {
    yields: [
        { yielded: 'cool', continued_with: Input(' beans') }
    ],
    returns: 'cool beans'
})
test_generator_expectation('concat string input but mess up the first 3 times', run_interaction(concat_string_input), {
    yields: [
        { yielded: 'cool', continued_with: Input(1) },
        { yielded: 'bad cool', continued_with: Input(2) },
        { yielded: 'bad bad cool', continued_with: Input(3) },
        { yielded: 'bad bad bad cool', continued_with: Input(' beans') }
    ],
    returns: 'bad bad bad cool beans'
})
test_partial_generator_expectation('concat string input is never saved', run_interaction(concat_string_input), {
    yields: [
        { yielded: 'cool', continued_with: Input(1) },
        { yielded: 'bad cool', continued_with: Input(2) },
        { yielded: 'bad bad cool', continued_with: Undo },
        { yielded: 'bad bad cool', continued_with: Input(3) },
        { yielded: 'bad bad bad cool', continued_with: Undo },
        { yielded: 'bad bad bad cool', continued_with: Input(' beans') }
    ],
    returns: 'bad bad bad cool beans'
})
const while_is_not_4: RunnableInteraction<number, number> =
    StartInteraction(
        0,
        While((state) => state !== 4, Update((state) => state + 1))
    )
test_generator_expectation('while is not 4', run_interaction(while_is_not_4), {
    yields: [],
    returns: 4
})
const while_inputs_do_not_add_to_4: RunnableInteraction<number, number> =
    StartInteraction(
        0,
        While((state) => state !== 4, WaitFor(UserInput((state, input) => Continue(state + input))))
    )
test_generator_expectation('while inputs do not add to 4', run_interaction(while_inputs_do_not_add_to_4), {
    yields: [
        { yielded: 0, continued_with: Input(3) },
        { yielded: 3, continued_with: Input(-10) },
        { yielded: -7, continued_with: Input(11) }
    ],
    returns: 4
})

type IncrementerState = {
    is_running: boolean,
    count: number,
    gave_bad_input: boolean
}
const initial_incrementer_state = {
    is_running: true,
    count: 0,
    gave_bad_input: false
}
const infinite_incrementer_interaction: RunnableInteraction<IncrementerState, boolean | string | undefined> =
    StartInteraction(
        initial_incrementer_state,
        While(({ is_running }) => is_running, RunSerially([
            WaitFor(UserInput((state) => Continue({ ...state, count: state.count + 1 })))
    ])))
test_partial_generator_expectation('infinite_incrementer_interaction', run_interaction(infinite_incrementer_interaction), {
    yields: [
        { yielded: initial_incrementer_state, continued_with: Input(true) },
        { yielded: { is_running: true, count: 1, gave_bad_input: false }, continued_with: Input(true) },
        { yielded: { is_running: true, count: 2, gave_bad_input: false }, continued_with: Input('cool') },
        { yielded: { is_running: true, count: 3, gave_bad_input: false }, continued_with: Input(undefined) },
    ]
})

const wait_for_one_of: RunnableInteraction<string, string> =
    StartInteraction(
        'nothing given',
        WaitFor(UserInput((state, input) =>
            input === 'yes' ? Continue('yes was pressed')
            : input === 'no' ? Continue('no was pressed')
            : input === 'possibly' ? Continue('possibly was pressed')
            : input === 'necessarily' ? Continue('necessarily was pressed')
            : Retry(state)))
    )
test_generator_expectation('wait for one of yes', run_interaction(wait_for_one_of), {
    yields: [
        { yielded: 'nothing given', continued_with: Input('yes') }
    ],
    returns: 'yes was pressed'
})
test_generator_expectation('wait for one of no', run_interaction(wait_for_one_of), {
    yields: [
        { yielded: 'nothing given', continued_with: Input('no') }
    ],
    returns: 'no was pressed'
})
test_generator_expectation('wait for one of possibly', run_interaction(wait_for_one_of), {
    yields: [
        { yielded: 'nothing given', continued_with: Input('possibly') }
    ],
    returns: 'possibly was pressed'
})
test_generator_expectation('wait for one of necessarily', run_interaction(wait_for_one_of), {
    yields: [
        { yielded: 'nothing given', continued_with: Input('necessarily') }
    ],
    returns: 'necessarily was pressed'
})

const enter_4_numbers: RunnableInteraction<number[], number> =
    StartInteraction(
        [] as number[],
        RunSerially([
            WaitFor(UserInput((state, input) => SaveThen(Continue([...state, input])))),
            WaitFor(UserInput((state, input) => SaveThen(Continue([...state, input])))),
            WaitFor(UserInput((state, input) => SaveThen(Continue([...state, input])))),
            WaitFor(UserInput((state, input) => SaveThen(Continue([...state, input]))))
        ])
    )
test_generator_expectation('entering 4 numbers normally', run_interaction(enter_4_numbers), {
    yields: [
        { yielded: [], continued_with: Input(2) },
        { yielded: [2], continued_with: Input(4) },
        { yielded: [2, 4], continued_with: Input(8) },
        { yielded: [2, 4, 8], continued_with: Input(16) },
    ],
    returns: [2, 4, 8, 16]
})
test_partial_generator_expectation('failing to undo multiple times', run_interaction(enter_4_numbers), {
    yields: [
        { yielded: [], continued_with: Undo },
        { yielded: [], continued_with: Undo },
        { yielded: [], continued_with: Undo },
    ]
})
test_partial_generator_expectation('doing a bunch of stuff then undoing then failing to undo', run_interaction(enter_4_numbers), {
    yields: [
        { yielded: [], continued_with: Input(16) },
        { yielded: [16], continued_with: Input(8) },
        { yielded: [16, 8], continued_with: Input(4) },
        { yielded: [16, 8, 4], continued_with: Undo },
        { yielded: [16, 8], continued_with: Undo },
        { yielded: [16], continued_with: Undo },
        { yielded: [], continued_with: Undo },
        { yielded: [], continued_with: Undo }
    ]
})
test_partial_generator_expectation('failing to redo multiple times', run_interaction(enter_4_numbers), {
    yields: [
        { yielded: [], continued_with: Redo },
        { yielded: [], continued_with: Redo },
        { yielded: [], continued_with: Redo }
    ]
})
test_partial_generator_expectation('doing a bunch of stuff then undoing then redoing then failing to redo', run_interaction(enter_4_numbers), {
    yields: [
        { yielded: [], continued_with: Input(16) },
        { yielded: [16], continued_with: Input(8) },
        { yielded: [16, 8], continued_with: Input(4) },
        { yielded: [16, 8, 4], continued_with: Undo },
        { yielded: [16, 8], continued_with: Undo },
        { yielded: [16], continued_with: Redo },
        { yielded: [16, 8], continued_with: Redo },
        { yielded: [16, 8, 4], continued_with: Redo },
        { yielded: [16, 8, 4] }
    ]
})

const update_then_wait =
    StartInteraction<string, string>(
        'cool',
        RunSerially([
            Update((state) => state + 'beans'),
            WaitFor(UserInput((state, input) => Continue(state + input)))
        ])
    )
test_generator_expectation('update then wait', run_interaction(update_then_wait), {
    yields: [
        { yielded: 'coolbeans', continued_with: Input(', bro.') }
    ],
    returns: 'coolbeans, bro.'
})

const default_message = 'type in a word without spaces'
const error_message = (input: string): string => `the text ${input} has spaces in it, so try again`
const a_bunch_of_words: RunnableInteraction<{ running: boolean, sentence: string, user_message: string }, string> =
    StartInteraction<{ running: boolean, sentence: string, user_message: string }, string>(
        { running: true, sentence: '', user_message: default_message },
        While(({ running }) => running, RunSerially([
            WaitFor(UserInput((state, input) =>
                input === '.' ? SaveThen(Continue({ ...state, sentence: state.sentence + '.', running: false }))
                : /\s/g.test(input) ? Retry({ ...state, user_message: error_message(input) })
                : SaveThen(Continue({ ...state, sentence: state.sentence + `${state.sentence === '' ? '' : ' '}${input}`, user_message: default_message }))
            ))
        ]))
    )
test_generator_expectation('a bunch of words normally', run_interaction(a_bunch_of_words), {
    yields: [
        { yielded: { running: true, sentence: '', user_message: default_message }, continued_with: Input('I') },
        { yielded: { running: true, sentence: 'I', user_message: default_message }, continued_with: Input('just') },
        { yielded: { running: true, sentence: 'I just', user_message: default_message }, continued_with: Input('typed') },
        { yielded: { running: true, sentence: 'I just typed', user_message: default_message }, continued_with: Input('a') },
        { yielded: { running: true, sentence: 'I just typed a', user_message: default_message }, continued_with: Input('bunch') },
        { yielded: { running: true, sentence: 'I just typed a bunch', user_message: default_message }, continued_with: Input('of') },
        { yielded: { running: true, sentence: 'I just typed a bunch of', user_message: default_message }, continued_with: Input('words') },
        { yielded: { running: true, sentence: 'I just typed a bunch of words', user_message: default_message }, continued_with: Input('.') },
    ],
    returns: {
        running: false,
        sentence: 'I just typed a bunch of words.',
        user_message: default_message
    }
})

// Question: What should happen when the user issues an UndoCommand when there's nothing left to undo?
// Option 1: Nothing -- just return the state.
// Option 2: Let the user register a FailedUndoHandler somewhere.
// - Question: Where?
// - Option 1: At the top of the interaction (boo).
// - Option 2: In run_interaction.
// - I like option 2 because Undo/Redo is implemented at the meta-level anyway, and run_interaction is the meta-entry point.
// - Actually JK option 1 makes more sense because the interaction author is the one who is most aware of how the state evolves, and handling failed Undos/Redos depends on state.
// Answer: Failed undo and failed redo handlers can optionally be registered to run when there's nothing to undo or nothing to run, respectively.
//         They can be registered at the start of a RunnableInteraction in StartInteraction.
//         If no undo handler is given, a failed undo just results in the current state.
//         Identically, if no redo handler is given, a failed redo just results in the current state.
test_partial_generator_expectation("undoing when there's nothing to undo", run_interaction(a_bunch_of_words), {
    yields: [
        { yielded: { running: true, sentence: '', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: '', user_message: default_message } },
    ]
})

test_partial_generator_expectation("doing a bunch of stuff then undoing until there's nothing to undo", run_interaction(a_bunch_of_words), {
    yields: [
        { yielded: { running: true, sentence: '', user_message: default_message }, continued_with: Input('I') },
        { yielded: { running: true, sentence: 'I', user_message: default_message }, continued_with: Input('just') },
        { yielded: { running: true, sentence: 'I just', user_message: default_message }, continued_with: Input('typed') },
        { yielded: { running: true, sentence: 'I just typed', user_message: default_message }, continued_with: Input('a') },
        { yielded: { running: true, sentence: 'I just typed a', user_message: default_message }, continued_with: Input('bunch') },
        { yielded: { running: true, sentence: 'I just typed a bunch', user_message: default_message }, continued_with: Input('of') },
        { yielded: { running: true, sentence: 'I just typed a bunch of', user_message: default_message }, continued_with: Input('words') },
        { yielded: { running: true, sentence: 'I just typed a bunch of words', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: 'I just typed a bunch of', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: 'I just typed a bunch', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: 'I just typed a', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: 'I just typed', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: 'I just', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: 'I', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: '', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: '', user_message: default_message } },
    ]
})

test_partial_generator_expectation("redoing when there's nothing to redo", run_interaction(a_bunch_of_words), {
    yields: [
        { yielded: { running: true, sentence: '', user_message: default_message }, continued_with: Redo },
        { yielded: { running: true, sentence: '', user_message: default_message } },
    ]
})

test_partial_generator_expectation("doing a bunch of stuff then undoing a bunch of stuff then redoing a bunch of stuff until there's nothing to redo", run_interaction(a_bunch_of_words), {
    yields: [
        { yielded: { running: true, sentence: '', user_message: default_message }, continued_with: Input('I') },
        { yielded: { running: true, sentence: 'I', user_message: default_message }, continued_with: Input('just') },
        { yielded: { running: true, sentence: 'I just', user_message: default_message }, continued_with: Input('typed') },
        { yielded: { running: true, sentence: 'I just typed', user_message: default_message }, continued_with: Input('a') },
        { yielded: { running: true, sentence: 'I just typed a', user_message: default_message }, continued_with: Input('bunch') },
        { yielded: { running: true, sentence: 'I just typed a bunch', user_message: default_message }, continued_with: Input('of') },
        { yielded: { running: true, sentence: 'I just typed a bunch of', user_message: default_message }, continued_with: Input('words') },
        { yielded: { running: true, sentence: 'I just typed a bunch of words', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: 'I just typed a bunch of', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: 'I just typed a bunch', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: 'I just typed a', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: 'I just typed', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: 'I just', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: 'I', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: '', user_message: default_message }, continued_with: Redo },
        { yielded: { running: true, sentence: 'I', user_message: default_message }, continued_with: Redo },
        { yielded: { running: true, sentence: 'I just', user_message: default_message }, continued_with: Redo },
        { yielded: { running: true, sentence: 'I just typed', user_message: default_message }, continued_with: Redo },
        { yielded: { running: true, sentence: 'I just typed a', user_message: default_message }, continued_with: Redo },
        { yielded: { running: true, sentence: 'I just typed a bunch', user_message: default_message }, continued_with: Redo },
        { yielded: { running: true, sentence: 'I just typed a bunch of', user_message: default_message }, continued_with: Redo },
        { yielded: { running: true, sentence: 'I just typed a bunch of words', user_message: default_message }, continued_with: Redo },
        { yielded: { running: true, sentence: 'I just typed a bunch of words', user_message: default_message } }
    ]
})

test_generator_expectation('a bunch of words but undoing everything then redoing some things before typing a period', run_interaction(a_bunch_of_words), {
    yields: [
        { yielded: { running: true, sentence: '', user_message: default_message }, continued_with: Input('I') },
        { yielded: { running: true, sentence: 'I', user_message: default_message }, continued_with: Input('just') },
        { yielded: { running: true, sentence: 'I just', user_message: default_message }, continued_with: Input('typed') },
        { yielded: { running: true, sentence: 'I just typed', user_message: default_message }, continued_with: Input('a') },
        { yielded: { running: true, sentence: 'I just typed a', user_message: default_message }, continued_with: Input('bunch') },
        { yielded: { running: true, sentence: 'I just typed a bunch', user_message: default_message }, continued_with: Input('of') },
        { yielded: { running: true, sentence: 'I just typed a bunch of', user_message: default_message }, continued_with: Input('words') },
        { yielded: { running: true, sentence: 'I just typed a bunch of words', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: 'I just typed a bunch of', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: 'I just typed a bunch', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: 'I just typed a', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: 'I just typed', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: 'I just', user_message: default_message }, continued_with: Undo },
        { yielded: { running: true, sentence: 'I', user_message: default_message }, continued_with: Redo },
        { yielded: { running: true, sentence: 'I just', user_message: default_message }, continued_with: Redo },
        { yielded: { running: true, sentence: 'I just typed', user_message: default_message }, continued_with: Redo },
        { yielded: { running: true, sentence: 'I just typed a', user_message: default_message }, continued_with: Redo },
        { yielded: { running: true, sentence: 'I just typed a bunch', user_message: default_message }, continued_with: Input('.') },
    ],
    returns: {
        running: false,
        sentence: 'I just typed a bunch.',
        user_message: default_message
    }
})

const conditional_continue_then =
    StartInteraction<string[][], string>(
        [] as string[][],
        RunSerially([
            Update((state) => [...state, ['BEGIN']]),
            WaitFor(UserInput((state, input) => {
                if (input === 'one')
                    return ContinueThen(RunSerially([
                        Update((state) => [...state, ['one']]),
                        WaitFor(UserInput((new_state, input) => Continue([...state, [...last(new_state)!, input]])))
                    ]))
                else if (input === 'two')
                    return ContinueThen(RunSerially([
                        Update((state) => [...state, ['two']]),
                        WaitFor(UserInput((new_state, input) => Continue([...state, [...last(new_state)!, input]]))),
                        WaitFor(UserInput((new_state, input) => Continue([...state, [...last(new_state)!, input]])))
                    ]))
                else
                    return Retry(state)
            })),
            Update((state) => [...state, ['END']])
        ])
    )
test_generator_expectation('conditional continue then one input', run_interaction(conditional_continue_then), {
    yields: [
        { yielded: [['BEGIN']], continued_with: Input('one') },
        { yielded: [['BEGIN'], ['one']], continued_with: Input('cool') },
    ],
    returns: [['BEGIN'], ['one', 'cool'], ['END']]
})
test_generator_expectation('conditional continue then two inputs', run_interaction(conditional_continue_then), {
    yields: [
        { yielded: [['BEGIN']], continued_with: Input('two') },
        { yielded: [['BEGIN'], ['two']], continued_with: Input('cool') },
        { yielded: [['BEGIN'], ['two', 'cool']], continued_with: Input('beans') }
    ],
    returns: [['BEGIN'], ['two', 'cool', 'beans'], ['END']]
})

const undo_redo_status_in_state =
    StartInteraction<{ can_undo: boolean, can_redo: boolean, numbers: number[] }, number>(
        {
            can_undo: false,
            can_redo: false,
            numbers: []
        },
        RunSerially([
            WaitFor(UserInput((state, input) => SaveThen(Continue({ ...state, numbers: [...state.numbers, input] })))),
            WaitFor(UserInput((state, input) => SaveThen(Continue({ ...state, numbers: [...state.numbers, input] })))),
            WaitFor(UserInput((state, input) => SaveThen(Continue({ ...state, numbers: [...state.numbers, input] })))),
        ]),
        {
            waiting_for_input: (state, undo_stack, redo_stack) => ({ ...state, can_undo: !is_empty(undo_stack), can_redo: !is_empty(redo_stack) })
        }
    )
test_generator_expectation('undo redo status in state', run_interaction(undo_redo_status_in_state), {
    yields: [
        { yielded: { can_undo: false, can_redo: false, numbers: [] }, continued_with: Input(1) },
        { yielded: { can_undo: true, can_redo: false, numbers: [1] }, continued_with: Input(2) },
        { yielded: { can_undo: true, can_redo: false, numbers: [1, 2] }, continued_with: Undo },
        { yielded: { can_undo: true, can_redo: true, numbers: [1] }, continued_with: Undo },
        { yielded: { can_undo: false, can_redo: true, numbers: [] }, continued_with: Redo },
        { yielded: { can_undo: true, can_redo: true, numbers: [1] }, continued_with: Input(3) },
        { yielded: { can_undo: true, can_redo: false, numbers: [1, 3] }, continued_with: Input(2) },
    ],
    returns: { can_undo: true, can_redo: false, numbers: [1, 3, 2] }
})

const only_save_on_even =
    StartInteraction<number[], number>(
        [],
        While((state) => state.length < 4,
            WaitFor(UserInput((state, input) => {
                if (input % 2 === 0)
                    return SaveThen(Continue([...state, input]))
                return Continue([...state, input])
            }))
        )
    )
test_generator_expectation('only save on even never save then undo o noes we cornt?', run_interaction(only_save_on_even), {
    yields: [
        { yielded: [], continued_with: Input(1) },
        { yielded: [1], continued_with: Input(3) },
        { yielded: [1, 3], continued_with: Input(5) },
        { yielded: [1, 3, 5], continued_with: Undo },
        { yielded: [1, 3, 5], continued_with: Input(7) }
    ],
    returns: [1, 3, 5, 7]
})
test_generator_expectation('only save on even through then back some', run_interaction(only_save_on_even), {
    yields: [
        { yielded: [], continued_with: Input(1) },
        { yielded: [1], continued_with: Input(2) },
        { yielded: [1, 2], continued_with: Input(3) },
        { yielded: [1, 2, 3], continued_with: Undo },
        { yielded: [1], continued_with: Input(3) },
        { yielded: [1, 3], continued_with: Input(4) },
        { yielded: [1, 3, 4], continued_with: Undo },
        { yielded: [1, 3], continued_with: Input(5) },
        { yielded: [1, 3, 5], continued_with: Undo },
        { yielded: [1, 3, 5], continued_with: Input(1) }
    ],
    returns: [1, 3, 5, 1]
})
test_partial_generator_expectation('only save on even forgetful undo', run_interaction(only_save_on_even), {
    yields: [
        { yielded: [], continued_with: Input(2) },
        { yielded: [2], continued_with: Undo },
        { yielded: [], continued_with: Redo },
        { yielded: [2], continued_with: Input(4) },
        { yielded: [2, 4], continued_with: ForgetfulUndo },
        { yielded: [2], continued_with: Redo },
        { yielded: [2] },
    ]
})

const only_save_on_retry_on_even =
    StartInteraction<number[], number>(
        [],
        While((state) => state.length < 4,
            WaitFor(UserInput((state, input) => {
                if (input % 2 === 0)
                    return SaveThen(Retry([...state, -input]))
                return Continue([...state, input])
            }))
        )
    )
test_generator_expectation('only save on retry on even', run_interaction(only_save_on_retry_on_even), {
    yields: [
        { yielded: [], continued_with: Input(1) },
        { yielded: [1], continued_with: Input(2) },
        { yielded: [1, -2], continued_with: Input(3) },
        { yielded: [1, -2, 3], continued_with: Undo },
        { yielded: [1], continued_with: Undo },
        { yielded: [1], continued_with: Input(4)},
        { yielded: [1, -4], continued_with: Input(6)},
        { yielded: [1, -4, -6], continued_with: Undo },
        { yielded: [1, -4], continued_with: Input(3) },
        { yielded: [1, -4, 3], continued_with: Input(5) }
    ],
    returns: [1, -4, 3, 5]
})

const only_save_on_continue_then =
    StartInteraction<number[], number>(
        [],
        RunSerially([
            WaitFor(UserInput((state, input) => Continue([input, ...state]))),
            WaitFor(UserInput((pre_state, pre_input) => SaveThen(ContinueThen(RunSerially([
                Update((state) => [1, ...state, 1]),
                WaitFor(UserInput((state, input) => Continue([pre_input, ...state, -input])))
            ]))))),
            WaitFor(UserInput((state, input) => Continue(state.map((s) => s * input))))
        ])
    )
test_generator_expectation('only_save_on_continue_then', run_interaction(only_save_on_continue_then), {
    yields: [
        { yielded: [], continued_with: Input(0) },
        { yielded: [0], continued_with: Undo },
        // Nothing's been saved yet, so nothing happens
        { yielded: [0], continued_with: Input(2) },
        { yielded: [1, 0, 1], continued_with: Input(4) },
        { yielded: [2, 1, 0, 1, -4], continued_with: Undo },
        { yielded: [0], continued_with: Input(3) },
        { yielded: [1, 0, 1], continued_with: Input(5) },
        { yielded: [3, 1, 0, 1, -5], continued_with: Input(-2) },
    ],
    returns: [-6, -2, -0, -2, 10]
})