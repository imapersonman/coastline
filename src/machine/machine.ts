import { display_stack, is_empty_stack, is_non_empty_stack, mk_stack, pop_entry, push_entry, Stack } from "../stack"
import { defined } from "../utilities"
import { CoastlineControl, display_coastline_control } from "./control"
import { is_coastline_error } from "./error"
import { AnyCoastlineObject, display_coastline_object, is_coastline_object } from "./object"
import { display_pending_operation, is_operator_app, PendingOperation, pending_operation } from "./operator"
import { is_options_tree, path_from_options_tree } from "./options_tree"
import { is_coastline_request } from "./request"

class CoastlineMachine { constructor(readonly c: CoastlineControl, readonly k: Stack<PendingOperation>) {} }
const coastline_machine = (c: CoastlineControl, k: Stack<PendingOperation>): CoastlineMachine => new CoastlineMachine(c, k)

export const display_coastline_machine = (m: CoastlineMachine) => ({
    c: display_coastline_control(m.c),
    k: display_stack(m.k, display_pending_operation)
})

export const start_machine = (initial_control: CoastlineControl): CoastlineMachine =>
    coastline_machine(initial_control, mk_stack())

// mainly for testing purposes.
export const finished_machine = (result: AnyCoastlineObject): CoastlineMachine =>
    coastline_machine(result, mk_stack())

// A TopList represents a List whose first element is the top of the Stack.
const stack_as_top_list = <T>(stack: Stack<T>): T[] =>
    is_non_empty_stack(stack)
        ? [stack.entry, ...stack_as_top_list(stack.rest)]
        : []

// A BottomList represents a List whose first element is at the bottom of the Stack.
const stack_as_bottom_list = <T>(stack: Stack<T>): T[] =>
    is_non_empty_stack(stack)
        ? [...stack_as_bottom_list(stack.rest), stack.entry]
        : []

export const step_machine = (m: CoastlineMachine): CoastlineMachine => {
    if (!machine_is_running(m))
        return m
    // machine_is_running(m), which means the following are also true:
    // - !is_coastline_error(m.c)
    // - !is_options_tree(m.c)
    // - !is_coastline_request(m.c)
    // - !(is_coastline_object(m.c) && is_empty_stack(m.k))
    // This leaves the following cases to handle:
    // - is_coastline_object(m.c) && !is_empty_stack(m.k)
    //   - PO at top of stack has arguments left.
    //   - PO at top of stack does not have any arguments left.
    // - is_operator_application(m.c)
    //   - OA doesn't have any arguments
    //   - OA has a first argument

    if (is_coastline_object(m.c) && is_non_empty_stack(m.k)) {
        const [po, rest_of_k] = pop_entry(m.k)
        const new_results_stack = push_entry(po.results, m.c)
        if (is_non_empty_stack(po.args)) {
            // (1) is_coastline_object(m.c) && is_non_empty_stack(m.k) && is_non_empty_stack(top_of(m.k.args))
            // console.log('(1) is_coastline_object(m.c) && is_non_empty_stack(m.k) && is_non_empty_stack(top_of(m.k.args))')
            const [arg, rest_of_args] = pop_entry(po.args)
            const new_pending_operation = pending_operation(po.op, rest_of_args, new_results_stack)
            return coastline_machine(arg, push_entry(rest_of_k, new_pending_operation))
        } else {
            // (2) is_coastline_object(m.c) && is_empty_stack(m.k)
            // console.log('(2) is_coastline_object(m.c) && is_empty_stack(m.k)')
            const new_control = po.op.f(stack_as_bottom_list(new_results_stack))
            return coastline_machine(new_control, rest_of_k)
        }
    } else if (is_operator_app(m.c)) {
        const argument_stack = mk_stack(...m.c.controls)
        if (!is_non_empty_stack(argument_stack)) {
            // (3) is_operator_application(m.c) && is_empty(m.c.controls)
            // console.log('(3) is_operator(m.c) && is_empty(m.c.controls)')
            return coastline_machine(m.c.definition.f([]), m.k)
        }
        // console.log('(4) is_operator(m.c) && !is_not_empty(m.c.controls)')
        // (4) is_operator_application(m.c) && !is_not_empty(m.c.controls)
        const [arg, rest_of_args] = pop_entry(argument_stack)
        const new_pending_operation = pending_operation(m.c.definition, rest_of_args, mk_stack())
        return coastline_machine(arg, push_entry(m.k, new_pending_operation))
    }
    throw new Error(`Unhandled step_machine case!\n${JSON.stringify(display_coastline_machine(m), undefined, 2)}`)
}

const machine_has_error = (m: CoastlineMachine): boolean =>
    is_coastline_error(m.c)

const machine_has_final_result = (m: CoastlineMachine): boolean =>
    is_coastline_object(m.c) && is_empty_stack(m.k)

const machine_is_paused = (m: CoastlineMachine): boolean =>
    is_options_tree(m.c) || is_coastline_request(m.c)

const machine_is_running = (m: CoastlineMachine): boolean =>
    !machine_has_final_result(m) && !machine_has_error(m) && !machine_is_paused(m)

export const run_machine_until_paused_or_halted = (m: CoastlineMachine): CoastlineMachine => {
    let current_m = m
    // console.log(JSON.stringify(display_coastline_machine(current_m), undefined, 2))
    while (machine_is_running(current_m)) {
        current_m = step_machine(current_m)
        // console.log(JSON.stringify(display_coastline_machine(current_m), undefined, 2))
    }
    return current_m
}

// Assumes that m's control is an OptionsTree and throws an exception if it is not.
// Assumes that path_label is a valid option within the control's OptionsTree and throws an error if it is not.
export const choose_machine_path = (m: CoastlineMachine, path_label: string): CoastlineMachine => {
    if (!is_options_tree(m.c))
        throw new Error(`Expected OptionsTree in control:\n${JSON.stringify(display_coastline_machine(m))}`)
    const path = path_from_options_tree(m.c, path_label)
    if (!defined(path))
        throw new Error(`Unknown path ${path_label}\nOptions are ${m.c.options.map(([label]) => label)}\n${JSON.stringify(display_coastline_machine(m), undefined, 2)}`)
    return coastline_machine(path, m.k)
}

// Assumes that m's control is AnyCoastlineRequest and throws an exception if it is not.
export const respond_to_machine_request = (m: CoastlineMachine, response: AnyCoastlineObject): CoastlineMachine => {
    if (!is_coastline_request(m.c))
        throw new Error
    return coastline_machine(m.c.f(response), m.k)
}

export type CoastlineCommand =
    | { type: 'Choice',   value: string }
    | { type: 'Response', value: AnyCoastlineObject }

export const choice   = (path: string)            : { type: 'Choice',   value: string             } => ({ type: 'Choice',   value: path })
export const response = (res: AnyCoastlineObject) : { type: 'Response', value: AnyCoastlineObject } => ({ type: 'Response', value: res  })

export type CoastlineScript = CoastlineCommand[]

export const step_machine_with_command = (m: CoastlineMachine, command: CoastlineCommand): CoastlineMachine => {
    if (command.type === 'Choice') {
        // console.log('choosing')
        // console.log(command.value)
        return choose_machine_path(m, command.value)
    }
    // console.log('responding with')
    // console.log(display_coastline_object(command.value))
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

