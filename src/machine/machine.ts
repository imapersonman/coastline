import { display_stack, is_empty_stack, is_non_empty_stack, mk_stack, pop_entry, possibly_pop_n_entries, push_entries, push_entry, Stack } from "../stack"
import { defined, display_or_undefined, is_array, is_string } from "../utilities"
import { CoastlineControl, display_coastline_control } from "./control"
import { is_coastline_error } from "./error"
import { AnyCoastlineObject, CoastlineObject, display_coastline_object, is_coastline_object, obj } from "./object"
import { display_pending_operation, is_operator_app, OperatorApplication, PendingOperation, pending_operation } from "./operator"
import { is_options_tree, OptionsTree } from "./options_tree"
import { AnyCoastlineRequest, is_coastline_request } from "./request"

export class CoastlineMachine {
    constructor(
        readonly control    : CoastlineControl | undefined,
        readonly stack      : Stack<CoastlineControl>,
        readonly operations : Stack<PendingOperation>,
        readonly results    : Stack<AnyCoastlineObject>
    ) {}
}

export const coastline_machine = (control: CoastlineControl | undefined, stack: Stack<CoastlineControl>, operations: Stack<PendingOperation>, results: Stack<AnyCoastlineObject>): CoastlineMachine =>
    new CoastlineMachine(control, stack, operations, results)

const display_coastline_machine = (m: CoastlineMachine) => ({
    control    : display_or_undefined(display_coastline_control, m.control),
    stack      : display_stack(m.stack, display_coastline_control),
    operations : display_stack(m.operations, display_pending_operation),
    results    : display_stack(m.results, display_coastline_object)
})

// Places initial_control in a newly-constructed CoastlineMachine's control register, and returns this machine without running it.
export const start_machine = (initial_control: CoastlineControl): CoastlineMachine =>
    coastline_machine(initial_control, mk_stack(), mk_stack(), mk_stack())

// mainly for testing purposes.
export const finished_machine = (result: AnyCoastlineObject): CoastlineMachine =>
    coastline_machine(undefined, mk_stack(), mk_stack(), mk_stack(result))

const is_executing_control = (control: CoastlineControl): control is OperatorApplication | AnyCoastlineObject =>
    is_operator_app(control) || is_coastline_object(control)

const is_pausing_control = (control: CoastlineControl): control is OptionsTree | AnyCoastlineRequest =>
    is_options_tree(control) || is_coastline_request(control)

const machine_is_finished = (m: CoastlineMachine): boolean =>
    m.control === undefined && is_empty_stack(m.stack) && is_empty_stack(m.operations)

const machine_is_running = (m: CoastlineMachine): boolean =>
    !machine_is_finished(m) && !is_coastline_error(m)

const machine_is_paused = (m: CoastlineMachine): boolean =>
    defined(m.control) && is_pausing_control(m.control)

const step_machine_with_undefined_control = (s: Stack<CoastlineControl>, o: Stack<PendingOperation>, r: Stack<AnyCoastlineObject>) => {
    // o is empty OR there aren't enough results to pop off the results stack for the top operator, so we'll try to pop the top control off of s
    // and make it the new control.
    if (is_non_empty_stack(s)) {
        const [new_c, new_s] = pop_entry(s)
        return coastline_machine(new_c, new_s, o, r)
    }
    if (is_non_empty_stack(o)) {
        const [op, new_o] = pop_entry(o)
        const possibly_popped_results = possibly_pop_n_entries(r, op.arity)
        if (defined(possibly_popped_results)) {
            const [results, new_r] = possibly_popped_results
            return coastline_machine(op.operator.f(results.slice().reverse()), s, new_o, new_r)
        }
    }
    // There should only be one element in the results stack, and we should throw an error if this is not the case.
    if (!machine_is_finished(coastline_machine(undefined, s, o, r)))
        throw new Error
    return coastline_machine(undefined, s, o, r)
}

const step_machine_with_executing_control = (c: AnyCoastlineObject | OperatorApplication, s: Stack<CoastlineControl>, o: Stack<PendingOperation>, r: Stack<AnyCoastlineObject>): CoastlineMachine => {
    if (is_coastline_object(c))
        return coastline_machine(undefined, s, o, push_entry(r, c))
    return coastline_machine(undefined, push_entries(s, c.controls.slice().reverse()), push_entry(o, pending_operation(c.definition, c.controls.length)), r)
}

// CoastlineControls can be separated into the following categories:
// - Executing: These controls will clear the control, deconstruct it's previous contents (c), and place them in the stacks in some manner.
//   - OperatorApplications
//     1) Clear the control register.
//     2) Place a pending_operation at the top of the operations stack, with c.definition as the operation and c.arguments.length as its arity.
//   - AnyCoastlineObject
//     1) Clear the control register.
//     2) Push the CoastlineObject onto the results stack as is.
// - Pausing: step_machine will return the current machine whenever the control register has either of these CoastlineControl's as its contents.
//   - AnyCoastlineRequests
//   - OptionsTrees
// - Halting: Whenever a HaltingControl is encountered in the control register, the machine has finished running.
//   - AnyCoastlineError
// - undefined (in order)
//   - If o is empty and k is non-empty, then pop the first element from k and place it into the c register.
//   - If o is non-empty and the length of r is ≥ pop_entry(o)[0].arity = n, then apply pop_entry(o)[0].definition with the first n elements of r as input.
//   - If both o and k are empty, then there should be exactly one element in r and we're finished!

// Steps the machine forward using exactly one of the rules above, or throws an error if the machine is in a state not reached by these rules after starting
// with a call to start_machine.
// If a CoastlineMachine is returned and it's control register is undefined, then there should be exactly one element in r and we can't step the machine
// any further.
export const step_machine = (m: CoastlineMachine): CoastlineMachine => {
    if (!defined(m.control))
        return step_machine_with_undefined_control(m.stack, m.operations, m.results)
    if (machine_is_finished(m) || is_pausing_control(m.control) || is_coastline_error(m.control))
        return m
    if (is_executing_control(m.control))
        return step_machine_with_executing_control(m.control, m.stack, m.operations, m.results)
    throw new Error
}

export const run_machine_until_paused_or_halted = (m: CoastlineMachine): CoastlineMachine => {
    let current_m = m
    console.log(JSON.stringify(display_coastline_machine(current_m), undefined, 2))
    while (machine_is_running(current_m) && !machine_is_paused(current_m) && !is_coastline_error(current_m.control)) {
        current_m = step_machine(current_m)
        console.log(JSON.stringify(display_coastline_machine(current_m), undefined, 2))
    }
    if (machine_is_finished(current_m) || machine_is_paused(current_m) || is_coastline_error(current_m.control))
        return current_m
    throw Error
}

const path_from_options_tree = (options_tree: OptionsTree, path_label: string): CoastlineControl | undefined => {
    const found_path_pair = options_tree.options.find(([label, path_f]) => path_label === label)
    if (!defined(found_path_pair))
        return undefined
    return found_path_pair[1]()
}

// Assumes that m's control is an OptionsTree and throws an exception if it is not.
// Assumes that path_label is a valid option within the control's OptionsTree and throws an error if it is not.
export const choose_machine_path = (m: CoastlineMachine, path_label: string): CoastlineMachine => {
    if (!is_options_tree(m.control))
        throw new Error(`Expected OptionsTree in control:\n${JSON.stringify(display_coastline_machine(m))}`)
    const path = path_from_options_tree(m.control, path_label)
    if (!defined(path))
        throw new Error(`Unknown path ${path_label}\nOptions are ${m.control.options.map(([label]) => label)}\n${JSON.stringify(display_coastline_machine(m))}`)
    return coastline_machine(path, m.stack, m.operations, m.results)
}

// Assumes that m's control is AnyCoastlineRequest and throws an exception if it is not.
export const respond_to_machine_request = (m: CoastlineMachine, response: AnyCoastlineObject): CoastlineMachine => {
    if (!is_coastline_request(m.control))
        throw new Error
    return coastline_machine(m.control.f(response), m.stack, m.operations, m.results)
}

export type CoastlineCommand =
    | { type: 'Choice',   value: string }
    | { type: 'Response', value: AnyCoastlineObject }

export const choice   = (path: string)            : { type: 'Choice',   value: string             } => ({ type: 'Choice',   value: path })
export const response = (res: AnyCoastlineObject) : { type: 'Response', value: AnyCoastlineObject } => ({ type: 'Response', value: res  })

export type CoastlineScript = CoastlineCommand[]

export const step_machine_with_command = (m: CoastlineMachine, command: CoastlineCommand): CoastlineMachine => {
    if (command.type === 'Choice')
        return choose_machine_path(m, command.value)
    return respond_to_machine_request(m, command.value)
}

export const run_machine_with_script = (m: CoastlineMachine, script: CoastlineScript): CoastlineMachine => {
    let current_m = run_machine_until_paused_or_halted(m)
    let command_index = 0
    while (machine_is_running(m) && command_index < script.length) {
        current_m = step_machine_with_command(current_m, script[command_index])
        current_m = run_machine_until_paused_or_halted(current_m)
        command_index++
    }
    return current_m
}

