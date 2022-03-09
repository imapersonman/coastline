import { concat_stacks, empty_stack, is_non_empty_stack, mk_stack, pop_entry, push_entry, Stack } from "../stack"
import { display_or_undefined, defined, index_out_of_bounds, is_empty } from "../utilities"
import { CoastlineControl, display_coastline_control } from "./control"
import { AnyCoastlineError, display_coastline_error, is_coastline_error } from "./error"
import { CoastlineCommand, CoastlineScript } from "./machine"
import { AnyCoastlineObject, display_coastline_object, is_coastline_object } from "./object"
import { OperatorApplication } from "./operator"
import { is_options_tree, OptionsTree } from "./options_tree"
// import { AnyCoastlineRequest, is_coastline_request, is_coastline_request2 } from "./request"
import { AnyCoastlineRequest2, is_coastline_request2 } from "./request"

export interface ETreeMachine {
    throw_error(e: AnyCoastlineError): Stack<ExecutionTree<CoastlineControl>>
    return_result(r: AnyCoastlineObject): Stack<ExecutionTree<CoastlineControl>>
    clear_result(): void
}

export class ReturnMachine implements ETreeMachine  {
    constructor(readonly parent: ExecutionTree<CoastlineControl>) {}

    throw_error(e: AnyCoastlineError): Stack<ExecutionTree<CoastlineControl>> {
        return this.parent.accept_thrown_error(e)
    }

    return_result(r: AnyCoastlineObject): Stack<ExecutionTree<CoastlineControl>> {
        return this.parent.accept_returned_result(r)
    }

    clear_result(): void {
        this.parent.accept_cleared_result()
    }
}

export class ArgumentMachine implements ETreeMachine {
    constructor(readonly parent: ApplicationETree, readonly argument_index: number) {}

    throw_error(e: AnyCoastlineError): Stack<ExecutionTree<CoastlineControl>> {
        return this.parent.accept_argument_error(e, this.argument_index)
    }

    return_result(r: AnyCoastlineObject): Stack<ExecutionTree<CoastlineControl>> {
        return this.parent.accept_argument_result(r, this.argument_index)
    }

    clear_result(): void {
        this.parent.accept_cleared_argument_result(this.argument_index)
    }
}

export class ResponseMachine implements ETreeMachine {
    constructor(readonly parent: RequestETree) {}

    throw_error(e: AnyCoastlineError): Stack<ExecutionTree<CoastlineControl>> {
        return this.parent.accept_thrown_error(e)
    }

    return_result(r: AnyCoastlineObject): Stack<ExecutionTree<CoastlineControl>> {
        return this.parent.accept_response_object(r)
    }

    clear_result(): void {
        return this.parent.accept_cleared_result()
    }
}

export class RootMachine implements ETreeMachine {
    throw_error(e: AnyCoastlineError): Stack<ExecutionTree<CoastlineControl>> {
        return mk_stack()
    }

    return_result(r: AnyCoastlineObject): Stack<ExecutionTree<CoastlineControl>> {
        return mk_stack()
    }

    clear_result(): void {}
}

export abstract class ExecutionTree<Control extends CoastlineControl> {
    protected error?: AnyCoastlineError
    protected result?: AnyCoastlineObject

    constructor(readonly control: Control, readonly machine: ETreeMachine) {}

    accept_thrown_error(e: AnyCoastlineError): Stack<ExecutionTree<CoastlineControl>> {
        this.error = e
        this.result = undefined
        return this.machine.throw_error(e)
    }

    accept_returned_result(r: AnyCoastlineObject): Stack<ExecutionTree<CoastlineControl>> {
        this.error = undefined
        this.result = r
        return this.machine.return_result(r)
    }

    accept_cleared_result(): void {
        this.result = undefined
        this.machine.clear_result()
    }

    get_error(): AnyCoastlineError | undefined {
        return this.error
    }

    get_result(): AnyCoastlineObject | undefined {
        return this.result
    }

    static from_control(control: CoastlineControl, machine: ETreeMachine): ExecutionTree<CoastlineControl> {
        if (is_coastline_object(control))
            return new ObjectETree(control, machine)
        if (is_coastline_error(control))
            return new ErrorETree(control, machine)
        if (is_options_tree(control))
            return new OptionsETree(control, machine)
        if (is_coastline_request2(control))
            return new RequestETree(control, machine)
        return new ApplicationETree(control, machine)
    }

    static root_from_control(control: CoastlineControl): ExecutionTree<CoastlineControl> {
        return ExecutionTree.from_control(control, new RootMachine)
    }

    static is_paused(etree: ExecutionTree<CoastlineControl>): etree is OptionsETree | RequestETree {
        return etree instanceof OptionsETree
            || etree instanceof RequestETree
    }

    static is_unpaused(etree: ExecutionTree<CoastlineControl>): etree is ObjectETree | ErrorETree | ApplicationETree {
        return !ExecutionTree.is_paused(etree)
    }

    static step_unpaused(unpaused: ObjectETree | ErrorETree | ApplicationETree): Stack<ExecutionTree<CoastlineControl>> {
        if (unpaused instanceof ObjectETree)
            return unpaused.return()
        if (unpaused instanceof ErrorETree)
            return unpaused.throw()
        return unpaused.apply()
    }

    static is_object(o: unknown): o is ObjectETree {
        return o instanceof ObjectETree
    }

    static is_error(e: unknown): e is ErrorETree {
        return e instanceof ErrorETree
    }

    static is_options(o: unknown): o is OptionsETree {
        return o instanceof OptionsETree
    }

    static is_request(r: unknown): r is RequestETree {
        return r instanceof RequestETree
    }

    static is_application(a: unknown): a is ApplicationETree {
        return a instanceof ApplicationETree
    }
}

export class ObjectETree extends ExecutionTree<AnyCoastlineObject> {
    constructor(readonly control: AnyCoastlineObject, readonly machine: ETreeMachine) {
        super(control, machine)
        this.return()
    }

    return(): Stack<ExecutionTree<CoastlineControl>> {
        return this.accept_returned_result(this.control)
    }
}

export class ErrorETree extends ExecutionTree<AnyCoastlineError> {
    constructor(readonly control: AnyCoastlineError, readonly machine: ETreeMachine) {
        super(control, machine)
        this.throw()
    }

    throw(): Stack<ExecutionTree<CoastlineControl>> {
        return this.accept_thrown_error(this.control)
    }
}

export class OptionsETree extends ExecutionTree<OptionsTree> {
    private return_tree?: ExecutionTree<CoastlineControl>
    private chosen_path?: string

    choose(path_label: string): Stack<ExecutionTree<CoastlineControl>> {
        this.machine.clear_result()
        const found_path = this.control.options.find(([label]) => path_label === label)
        if (!defined(found_path))
            throw new Error(`path_label passed into OptionETree's choose does not exist in the OptionsTree!\npath_label: ${path_label}\noptions: ${this.control.options.map(([label]) => label)}`)
        this.chosen_path = path_label
        this.return_tree = ExecutionTree.from_control(found_path[1](), new ReturnMachine(this))
        return mk_stack(this.return_tree)
    }

    get_return_tree(): ExecutionTree<CoastlineControl> | undefined {
        return this.return_tree
    }

    get_chosen_path(): string | undefined {
        return this.chosen_path
    }
}

export class RequestETree extends ExecutionTree<AnyCoastlineRequest2> {
    private return_tree?: ExecutionTree<CoastlineControl>
    private response_tree?: ExecutionTree<CoastlineControl>
    private response_object?: AnyCoastlineObject

    // respond(response: AnyCoastlineObject): Stack<ExecutionTree<CoastlineControl>> {
    respond(response: CoastlineControl): Stack<ExecutionTree<CoastlineControl>> {
        // this.response_tree = ExecutionTree.from_control(response, new ResponseMachine(this))
        // this.return_tree = ExecutionTree.from_control(this.control.f(response), new ResponseMachine(this, response))
        this.return_tree = ExecutionTree.from_control(response, new ReturnMachine(this))
        return mk_stack(this.return_tree)
    }

    accept_response_object(r: AnyCoastlineObject): Stack<ExecutionTree<CoastlineControl>> {
        this.response_object = r
        this.return_tree = ExecutionTree.from_control(r, new ReturnMachine(this))
        return mk_stack(this.return_tree)
    }

    get_response_tree(): ExecutionTree<CoastlineControl> | undefined {
        return this.response_tree
    }

    get_response_object(): AnyCoastlineObject | undefined {
        return this.response_object
    }

    get_return_tree(): ExecutionTree<CoastlineControl> | undefined {
        return this.return_tree
    }
}

export class ApplicationETree extends ExecutionTree<OperatorApplication> {
    private argument_results: (AnyCoastlineObject | undefined)[]
    private argument_trees: ExecutionTree<CoastlineControl>[] = []
    private return_tree?: ExecutionTree<CoastlineControl>

    constructor(control: OperatorApplication, machine: ETreeMachine) {
        super(control, machine)
        this.argument_results = new Array(this.control.controls.length).fill(undefined)
        this.apply()
    }

    apply(): Stack<ExecutionTree<CoastlineControl>> {
        this.argument_trees = this.control.controls.map((arg_c, index) =>
            ExecutionTree.from_control(arg_c, new ArgumentMachine(this, index)))
        return concat_stacks(mk_stack(...this.argument_trees), this.attempt_to_create_return_tree())
    }

    accept_argument_error(e: AnyCoastlineError, argument_index: number): Stack<ExecutionTree<CoastlineControl>> {
        this.return_tree = undefined
        this.argument_results[argument_index] = undefined
        return this.machine.throw_error(e)
    }

    accept_argument_result(r: AnyCoastlineObject, argument_index: number): Stack<ExecutionTree<CoastlineControl>> {
        const n_results = Object.values(this.argument_results).length
        if (index_out_of_bounds(argument_index, Object.values(this.argument_results).length))
            throw new Error(`argument_index passed into ApplicationETree's accept_argument_result is out of bounds!\nindex: ${argument_index}\nbounds: 0 <= index < ${n_results}`)
        this.argument_results[argument_index] = r
        this.attempt_to_create_return_tree()
        return mk_stack(this.return_tree)
    }

    accept_cleared_argument_result(argument_index: number): void {
        this.argument_results[argument_index] = undefined
        this.return_tree = undefined
        this.machine.clear_result()
    }

    private attempt_to_create_return_tree(): Stack<ExecutionTree<CoastlineControl>> {
        if (!this.all_arguments_have_returned(this.argument_results))
            return empty_stack
        this.return_tree = ExecutionTree.from_control(this.control.definition.f(this.argument_results), new ReturnMachine(this))
        return mk_stack(this.return_tree)
    }

    get_argument_results(): (AnyCoastlineObject | undefined)[] {
        return this.argument_results
    }

    get_argument_trees(): ExecutionTree<CoastlineControl>[] | undefined {
        return this.argument_trees
    }

    get_return_tree(): ExecutionTree<CoastlineControl> | undefined {
        return this.return_tree
    }

    private all_arguments_have_returned(ars: (AnyCoastlineObject | undefined)[]): ars is AnyCoastlineObject[] {
        return this.argument_results.every(defined)
    }
}

// Mutates etree (a lot)!
export const run_execution_tree_stack_until_paused_or_finished = (initial_stack: Stack<ExecutionTree<CoastlineControl>>): Stack<ExecutionTree<CoastlineControl>> => {
    let stack = initial_stack
    while (is_non_empty_stack(stack)) {
        const popped = pop_entry(stack)
        const current = popped[0]
        if (!ExecutionTree.is_unpaused(current))
            return stack
        stack = popped[1]
        stack = concat_stacks(ExecutionTree.step_unpaused(current), stack)
    }
    return stack
}

export const step_paused_execution_tree_with_command = (etree: OptionsETree | RequestETree, command: CoastlineCommand): Stack<ExecutionTree<CoastlineControl>> => {
    if (etree instanceof OptionsETree)
        if (command.type === 'Choice')
            return etree.choose(command.value)
        else
            throw new Error('Cannot use a Response to step an OptionsETree!')
    if (etree instanceof RequestETree)
        if (command.type === 'Response')
            return etree.respond(command.value)
        else
            throw new Error('Cannot use a Response to step a RequestETree!')
    throw new Error(`Unrecognized command type when stepping an execution tree: ${command.type}`)
}

export const run_execution_tree_stack_with_script = (initial_stack: Stack<ExecutionTree<CoastlineControl>>, script: CoastlineScript): Stack<ExecutionTree<CoastlineControl>> => {
    let stack = initial_stack
    let script_index = 0
    stack = run_execution_tree_stack_until_paused_or_finished(stack)
    while (is_non_empty_stack(stack)) {
        const popped = pop_entry(stack)
        const current = popped[0]
        stack = popped[1]
        if (ExecutionTree.is_paused(current))
            if (script_index < script.length) {
                stack = concat_stacks(step_paused_execution_tree_with_command(current, script[script_index]), stack)
                script_index++
            } else {
                console.log(JSON.stringify(display_execution_tree(current), undefined, 2))
                return push_entry(stack, current)
            }
        else if (ExecutionTree.is_unpaused(current))
            stack = concat_stacks(ExecutionTree.step_unpaused(current), stack)
    }
    return stack
}

export const display_execution_tree = (etree: ExecutionTree<CoastlineControl>) => {
    const display_specific_execution_tree = (specific_etree: ExecutionTree<CoastlineControl>) => {
        if (specific_etree instanceof OptionsETree)
            return {
                chosen_path: specific_etree.get_chosen_path() ?? 'undefined',
                return_tree: display_or_undefined(display_execution_tree, specific_etree.get_return_tree()),
            }
        if (specific_etree instanceof RequestETree)
            return {
                response_tree: display_or_undefined(display_execution_tree, specific_etree.get_response_tree()),
                return_tree: display_or_undefined(display_execution_tree, specific_etree.get_return_tree())
            }
        if (specific_etree instanceof ApplicationETree)
            return {
                argument_results: specific_etree.get_argument_results().map((ar) => display_or_undefined(display_coastline_object, ar)),
                argument_trees: display_or_undefined((ats) => ats.map((at) => display_execution_tree(at)), specific_etree.get_argument_trees()),
                return_tree: display_or_undefined(display_execution_tree, specific_etree.get_return_tree())
            }
        return {}
    }
    return {
        control: display_coastline_control(etree.control),
        result: display_or_undefined(display_coastline_object, etree.get_result()),
        error: display_or_undefined(display_coastline_error, etree.get_error()),
        ...display_specific_execution_tree(etree)
    }
}

