import { defined, first, is_empty, rest } from '../../src/utilities'

export type Interaction<State, UserInput> =
    | UpdatingInteraction<State>
    | SerialInteraction<State, UserInput>
    | WaitingInteraction<State, UserInput>
    // | DisjunctiveWaitingInteraction<State, UserInput>
    | LoopedConditionalInteraction<State, UserInput>
    | FinishedInteraction
class UpdatingInteraction<State> { constructor(readonly updater: (state: State) => State) {} }
class SerialInteraction<State, UserInput> { constructor(readonly statements: Interaction<State, UserInput>[]) {} }
class WaitingInteraction<State, UserInput> { constructor(readonly event: UserInputEvent<State, UserInput>) {} }
// class DisjunctiveWaitingInteraction<State, UserInput> { constructor(readonly events: UserInputEvent<State, UserInput>[]) {} }
class LoopedConditionalInteraction<State, UserInput> { constructor(readonly condition: (state: State) => boolean, readonly statement: Interaction<State, UserInput>) {} }
class FinishedInteraction {}

class UserInputEvent<State, UserInput> { constructor(readonly input_validator: (state: State, input: UserInput) => ControlStatus<State, UserInput>) {} }

type RunnableInteractionLifecycle<State> = {
    waiting_for_input?: (state: State, undo_stack: State[], redo_stack: State[]) => State
    just_given_input?: (state: State, undo_stack: State[], redo_stack: State[]) => State
    modify_for_save?: (state: State) => State
}
export class RunnableInteraction<State, UserInput> {
    constructor(readonly initial_state: State, readonly interaction: Interaction<State, UserInput>, readonly lifecycle?: RunnableInteractionLifecycle<State>) {}
}
export type ControlStatus<State, UserInput> =
    | { status: 'Continue' | 'Retry', state: State }
    | { status: 'ContinueThen', interaction: Interaction<State, UserInput> }
    | { status: 'SaveThen', control_status: ControlStatus<State, UserInput> }
export const is_control_status = (c: any): c is ControlStatus<unknown, unknown> => 'status' in c
export const SaveThen = <State, UserInput>(control_status: ControlStatus<State, UserInput>): ControlStatus<State, UserInput> => ({ status: 'SaveThen', control_status })
export const should_save_then = <State, UserInput>(control_status: ControlStatus<State, UserInput>): control_status is { status: 'SaveThen', control_status: ControlStatus<State, UserInput> } => control_status.status === 'SaveThen'
export const Continue = <State, UserInput>(state: State): ControlStatus<State, UserInput> => ({ status: 'Continue', state })
export const should_continue = <State, UserInput>(control: ControlStatus<State, UserInput>): control is { status: 'Continue', state: State } => control.status === 'Continue'
export const ContinueThen = <State, UserInput>(interaction: Interaction<State, UserInput>): ControlStatus<State, UserInput> => ({ status: 'ContinueThen', interaction })
export const should_continue_then = <State, UserInput>(control: ControlStatus<State, UserInput>): control is { status: 'ContinueThen', interaction: Interaction<State, UserInput> } => control.status === 'ContinueThen'
export const Retry = <State, UserInput>(state: State): ControlStatus<State, UserInput> => ({ status: 'Retry', state })
export const should_retry = <State, UserInput>(control: ControlStatus<State, UserInput>): control is { status: 'Retry', state: State } => control.status === 'Retry'

export type PossibleUserInput<UserInput> =
    | InputCommand<UserInput>
    | UndoCommand
    | RedoCommand
class InputCommand<UserInput> { constructor(readonly input: UserInput) {} }
class UndoCommand { constructor(readonly push_to_redo: boolean) {} }
class RedoCommand {}

export const Input = <UserInput>(input: UserInput) => new InputCommand(input)
export const Undo = new UndoCommand(true)
export const ForgetfulUndo = new UndoCommand(false)
export const Redo = new RedoCommand()

export const StartInteraction = <State, UserInput>(initial: State, interaction: Interaction<State, UserInput>, lifecycle?: RunnableInteractionLifecycle<State>): RunnableInteraction<State, UserInput> =>
    new RunnableInteraction(initial, interaction, lifecycle)
export const Update = <State>(f: (s: State) => State) =>
    new UpdatingInteraction(f)
export const WaitFor = <State, UserInput>(event: UserInputEvent<State, UserInput>) =>
    new WaitingInteraction(event)
export const UserInput = <State, UserInput>(input_validator: (state: State, input: UserInput) => ControlStatus<State, UserInput>) =>
    new UserInputEvent(input_validator)
export const RunSerially = <State, UserInput>(statements: Interaction<State, UserInput>[]): Interaction<State, UserInput> =>
    new SerialInteraction(statements)
export const While = <State, UserInput>(f: (s: State) => boolean, statement: Interaction<State, UserInput>): Interaction<State, UserInput> =>
    new LoopedConditionalInteraction(f, statement)

interface InteractionRegisters<State, UserInput> {
    state: State,
    stack: Interaction<State, UserInput>[],
    undo_stack: { state: State, stack: Interaction<State, UserInput>[] }[],
    redo_stack: { state: State, stack: Interaction<State, UserInput>[] }[]
}

const initialize_registers = <State, UserInput>(runnable_interaction: RunnableInteraction<State, UserInput>): InteractionRegisters<State, UserInput> => ({
    state: runnable_interaction.initial_state,
    stack: [runnable_interaction.interaction],
    undo_stack: [],
    redo_stack: []
})

const undo = <State, UserInput>(registers: InteractionRegisters<State, UserInput>, push_to_redo: boolean): InteractionRegisters<State, UserInput> => {
    if (is_empty(registers.undo_stack))
        return registers
    const old_frame = { state: registers.state, stack: registers.stack }
    const { state, stack } = first(registers.undo_stack)
    return {
        state,
        stack,
        undo_stack: rest(registers.undo_stack),
        redo_stack: push_to_redo ? [old_frame, ...registers.redo_stack] : registers.redo_stack
    }
}

const redo = <State, UserInput>(registers: InteractionRegisters<State, UserInput>): InteractionRegisters<State, UserInput> => {
    if (is_empty(registers.redo_stack))
        return registers
    const old_frame = { state: registers.state, stack: registers.stack }
    const { state, stack } = first(registers.redo_stack)
    return {
        state,
        stack,
        undo_stack: [old_frame, ...registers.undo_stack],
        redo_stack: rest(registers.redo_stack)
    }
}

const save = <State, UserInput>(
    registers: InteractionRegisters<State, UserInput>,
    new_state: State,
    new_stack: Interaction<State, UserInput>[],
    modify_for_save: (state: State) => State = (x) => x
): InteractionRegisters<State, UserInput> => {
    const old_frame = { state: modify_for_save(registers.state), stack: registers.stack }
    return {
        state: modify_for_save(new_state),
        stack: new_stack,
        undo_stack: [old_frame, ...registers.undo_stack],
        redo_stack: []
    }
}

const step = <State, UserInput>(
    registers: InteractionRegisters<State, UserInput>,
    new_state: State,
    new_stack: Interaction<State, UserInput>[]
): InteractionRegisters<State, UserInput> => {
    return {
        ...registers,
        state: new_state,
        stack: new_stack,
    }
}

export function* run_interaction<State, UserInput>(
    runnable_interaction: RunnableInteraction<State, UserInput>
): Generator<State, State, PossibleUserInput<UserInput>> {
    let acc_registers: InteractionRegisters<State, UserInput> = initialize_registers(runnable_interaction)
    while (!is_empty(acc_registers.stack)) {
        const interaction = first(acc_registers.stack)
        const rest_of_stack = rest(acc_registers.stack)
        if (interaction instanceof UpdatingInteraction) {
            acc_registers = {
                ...acc_registers,
                state: interaction.updater(acc_registers.state),
                stack: rest_of_stack
            }
        } else if (interaction instanceof SerialInteraction) {
            acc_registers = { ...acc_registers, stack: [...interaction.statements, ...rest_of_stack] }
        } else if (interaction instanceof LoopedConditionalInteraction) {
            if (interaction.condition(acc_registers.state)) {
                acc_registers = { ...acc_registers, stack: [interaction.statement, interaction, ...rest_of_stack] }
            } else {
                acc_registers = { ...acc_registers, stack: rest_of_stack }
            }
        } else if (interaction instanceof WaitingInteraction) {
            if (defined(runnable_interaction.lifecycle) && defined(runnable_interaction.lifecycle.waiting_for_input))
                acc_registers = {
                    ...acc_registers,
                    state: runnable_interaction.lifecycle.waiting_for_input(
                        acc_registers.state,
                        acc_registers.undo_stack.map(({ state }) => state),
                        acc_registers.redo_stack.map(({ state }) => state))
                }
            const possible_input = yield acc_registers.state
            if (possible_input instanceof InputCommand) {
                let control_status = interaction.event.input_validator(
                    acc_registers.state,
                    possible_input.input
                )
                if (should_save_then(control_status)) {
                    acc_registers = save(acc_registers, acc_registers.state, rest_of_stack, runnable_interaction.lifecycle?.modify_for_save)
                    control_status = control_status.control_status
                }
                if (should_retry(control_status))
                    // acc_registers = { ...acc_registers, state: control_status.state, stack: [interaction, ...rest_of_stack] }
                    acc_registers = step(acc_registers, control_status.state, [interaction, ...rest_of_stack])
                else if (should_continue(control_status))
                    acc_registers = step(acc_registers, control_status.state, rest_of_stack)
                else if (should_continue_then(control_status))
                    acc_registers = step(acc_registers, acc_registers.state, [control_status.interaction, ...rest_of_stack])
            } else if (possible_input instanceof UndoCommand) {
                acc_registers = undo(acc_registers, possible_input.push_to_redo)
            } else if (possible_input instanceof RedoCommand) {
                acc_registers = redo(acc_registers)
            }
            if (defined(runnable_interaction.lifecycle) && defined(runnable_interaction.lifecycle.just_given_input))
                acc_registers = {
                    ...acc_registers,
                    state: runnable_interaction.lifecycle.just_given_input(
                        acc_registers.state,
                        acc_registers.undo_stack.map(({ state }) => state),
                        acc_registers.redo_stack.map(({ state }) => state))
                }
        }
    }
    return acc_registers.state
}

