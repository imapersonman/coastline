import { Continue, Retry, RunnableInteraction, RunSerially, SaveThen, StartInteraction, Update, UserInput, WaitFor, While } from "../src/interaction/interaction"
import { display_stack, is_empty_stack, is_non_empty_stack, mk_stack, NonEmptyStack, pop_entry, possibly_pop_n_entries, push_entries, push_entry, Stack, stack_length } from "../src/stack"
import { defined } from "../src/utilities"

export class TransitionError<E> { constructor(readonly e: E) {} }
export const transition_error = <E>(e: E): TransitionError<E> => new TransitionError(e)
export const is_transition_error = <E>(e: unknown): e is TransitionError<E> => e instanceof TransitionError

export class TransitionResult<R> { constructor(readonly r: R) {} }
export const transition_result = <R>(r: R): TransitionResult<R> => new TransitionResult(r)
export const is_transition_result = <R>(r: unknown): r is TransitionResult<R> => r instanceof TransitionResult

export class CombinedTransitionResult<F, R> { constructor(readonly combiner: (rs: R[]) => R, readonly frames: F[]) {} }
export const combined_transition_result = <F, R>(c: (rs: R[]) => R, fs: F[]): CombinedTransitionResult<F, R> => new CombinedTransitionResult(c, fs)
export const is_combined_transition_result = <F, R>(c: unknown): c is CombinedTransitionResult<F, R> => c instanceof CombinedTransitionResult

export class TransitionInputRequest<FM extends FrameMap, RM extends RequestMap, E, R> {
    constructor(
        readonly request_id: Request<RM>,
        readonly r_f: (response: Response<RM>) => TransitionStatus<FM, RM, E, R>
    ) {}
}
export const transition_input_request = <FM extends FrameMap, RM extends RequestMap, E, R, Req extends keyof RM>(
    req: RM[Req]['payload'] extends undefined ? Req : { type: Req, payload: RM[Req]['payload'] },
    r_f: (res: RM[Req]['response']) => TransitionStatus<FM, RM, E, R>
): TransitionInputRequest<FM, RM, E, R> => new TransitionInputRequest(req, r_f)
export const is_transition_input_request = <FM extends FrameMap, RM extends RequestMap, E, R>(t: unknown): t is TransitionInputRequest<FM, RM, E, R> => t instanceof TransitionInputRequest

export type RequestMap = { [request_id: string]: { payload: any, response: any } }
export type Request <RM extends RequestMap> = { [RequestName in keyof RM]: RM[RequestName]['payload'] extends undefined ? RequestName : { type: RequestName, payload: RM[RequestName]['payload']  } }[keyof RM]
export type Response<RM extends RequestMap> = { [RequestName in keyof RM]: RM[RequestName]['response'] }[keyof RM]

export type TransitionStatus<FM extends FrameMap, RM extends RequestMap, Error, Result> =
    | TransitionError<Error>
    | TransitionResult<Result>
    | CombinedTransitionResult<Frame<FM>, Result>
    | TransitionInputRequest<FM, RM, Error, Result>

export type FrameMap = { [id: string]: { input: any, transition_ids: any } }

export type TransitionIDs<FM extends FrameMap> =
    FM[keyof FM]['transition_ids']


export type TransitionFunction<FM extends FrameMap, RM extends RequestMap, Error, Result> =
    (frame: Frame<FM>, transition_id: TransitionIDs<FM>) => TransitionStatus<FM, RM, Error, Result>

export type Frame<FM extends FrameMap> = {
    [FrameName in keyof FM]: { type: FrameName, value: FM[FrameName]['input'] }
}[keyof FM]

export type FrameMachineState<InitialInput, FM extends FrameMap, Error, Result> = {
    initial_input?  : InitialInput
    current_frame?  : Frame<FM>
    frame_stack     : Stack<Frame<FM>>
    operation_stack : Stack<Operation<Result>>
    result_stack    : Stack<Result>
    error?          : Error
    tree?           : TransitionTree<Frame<FM>, TransitionIDs<FM>, Result>
}

export class Operation<Result> {
    constructor(readonly number_of_arguments: number, private readonly f: (args: Result[]) => Result) {}

    apply(args: Result[]): Result {
        if (args.length !== this.number_of_arguments)
            throw new Error(`Operation expected ${this.number_of_arguments} arguments, but instead got ${args.length}`)
        return this.f(args)
    }
}

export const operation = <Result>(n: number, f: (args: Result[]) => Result): Operation<Result> => new Operation(n, f)

export class CurrentTree<Frame> { constructor(readonly frame: Frame) {} }
export const current = <F>(f: F): CurrentTree<F> => new CurrentTree(f)
export const is_current = <F>(c: unknown): c is CurrentTree<F> => c instanceof CurrentTree

export class WaitingTree<Frame> { constructor(readonly frame: Frame) {} }
export const waiting = <F>(f: F): WaitingTree<F> => new WaitingTree(f)
export const is_waiting = <F>(f: F): CurrentTree<F> => new WaitingTree(f)

export class RunningTree<Frame, TransitionID, Result> {
    constructor(
        readonly frame: Frame,
        readonly transition: TransitionID,
        readonly children: TransitionTree<Frame, TransitionID, Result>[]
    ) {}
}
export const running = <F, T, R>(f: F, t: T, cs: TransitionTree<F, T, R>[]): RunningTree<F, T, R> => new RunningTree(f, t, cs)
export const is_running = <F, T, R>(r: unknown): r is RunningTree<F, T, R> => r instanceof RunningTree

export class FinishedTree<Frame, TransitionID, Result> {
    constructor(
        readonly frame: Frame,
        readonly transition: TransitionID,
        readonly result: Result,
        readonly children: FinishedTree<Frame, TransitionID, Result>[]
    ) {}
}
export const finished = <F, T, R>(f: F, t: T, r: R, cs: FinishedTree<F, T, R>[]): FinishedTree<F, T, R> => new FinishedTree(f, t, r, cs)
export const is_finished = <F, T, R>(f: unknown): f is FinishedTree<F, T, R> => f instanceof FinishedTree

export type TransitionTree<Frame, TransitionID, Result> =
    | CurrentTree<Frame>
    | WaitingTree<Frame>
    | RunningTree<Frame, TransitionID, Result>
    | FinishedTree<Frame, TransitionID, Result>

export const simplify_results = <II, FM extends FrameMap, E, R>(state: FrameMachineState<II, FM, E, R>): FrameMachineState<II, FM, E, R> => {
    let { operation_stack, result_stack } = state
    let current_ops_and_results = step_results_simplification(operation_stack, result_stack)
    while (defined(current_ops_and_results)) {
        operation_stack = current_ops_and_results[0]
        result_stack = current_ops_and_results[1]
        current_ops_and_results = step_results_simplification(operation_stack, result_stack)
    }
    return { ...state, operation_stack, result_stack }
}

const return_result = <II, FM extends FrameMap, E, R>(state: FrameMachineState<II, FM, E, R>, result: R): FrameMachineState<II, FM, E, R> => {
    const new_result_stack = push_entry(state.result_stack, result)
    return simplify_results({ ...state, result_stack: new_result_stack })
}

// the number of frame pushed onto the new stack is equal to the number of arguments the operation takes.
const compute_then_return_result = <InitialInput, FM extends FrameMap, Error, Result>(
    state: FrameMachineState<InitialInput, FM, Error, Result>,
    new_frames: Frame<FM>[],
    operation: Operation<Result>
): FrameMachineState<InitialInput, FM, Error, Result> => {
    // push newly created_frames onto the frames stack so that the first_frame is first, and the rest_frame is next.
    const new_frame_stack = push_entries(state.frame_stack, new_frames)
    // push an operation taking 2 arguments equal, spitting out the result of and-ing all the results together.
    const new_operation_stack = push_entry(state.operation_stack, operation)
    return { ...state, frame_stack: new_frame_stack, operation_stack: new_operation_stack }
}

export const any_id_1 = <R>([r]: R[]): R => r

export const result_of = <F, R>(frame: F): CombinedTransitionResult<F, R> =>
    combined_transition_result(any_id_1, [frame])

export const step_results_simplification = <Result>(op_stack: Stack<Operation<Result>>, re_stack: Stack<Result>): [Stack<Operation<Result>>, Stack<Result>] | undefined => {
    if (!is_non_empty_stack(op_stack))
        return undefined
    const [top, new_op_stack] = pop_entry(op_stack)
    const possibly_popped_re_stack = possibly_pop_n_entries(re_stack, top.number_of_arguments)
    if (!defined(possibly_popped_re_stack))
        // throw new Error(`Expected ${top.number_of_arguments} arguments in results stack, but instead got ${stack_length(re_stack)} arguments:\n${display_stack(re_stack)}`)
        return undefined
    const [popped_re_entries, popped_re_stack] = possibly_popped_re_stack
    const new_result = top.apply(popped_re_entries)
    const new_result_stack = push_entry(popped_re_stack, new_result)
    return [new_op_stack, new_result_stack]
}

export type FrameMachineInput<InitialInput, FM extends FrameMap> =
    | { type: 'InitialInput', value: InitialInput }
    | { type: 'Tactic',       value: TransitionIDs<FM> }
export type FrameMachine<InitialInput, FM extends FrameMap, Error, Result> =
    RunnableInteraction<FrameMachineState<InitialInput, FM, Error, Result>, FrameMachineInput<InitialInput, FM>>

export const check_for_valid_state = <II, FM extends FrameMap, E, R>(state: FrameMachineState<II, FM, E, R>): FrameMachineState<II, FM, E, R> => {
    if (is_empty_stack(state.frame_stack) && !is_empty_stack(state.operation_stack))
        throw new Error('Invalid TermsEqualState: Frame stack is empty while operations stack is non-empty.')
    if (is_empty_stack(state.frame_stack) && is_empty_stack(state.operation_stack) && stack_length(state.result_stack) !== 1)
        throw new Error(`Invalid TermsEqualState: Frame and operations stack are empty, but the results stack has a length not equal to 1:\n${display_stack(state.result_stack)}`)
    return state
}

export const mk_frame_machine = <InitialInput, FM extends FrameMap, RM extends RequestMap, Error, Result, Req extends keyof RM>(
    frame_from_initial_input : (ii: InitialInput) => Frame<FM>,
    run_frame_transition     : TransitionFunction<FM, RM, Error, Result>,
): FrameMachine<InitialInput, FM, Error, Result> =>
    StartInteraction<FrameMachineState<InitialInput, FM, Error, Result>, FrameMachineInput<InitialInput, FM>>(
        {
            initial_input   : undefined,
            current_frame   : undefined,
            frame_stack     : mk_stack(),
            result_stack    : mk_stack(),
            operation_stack : mk_stack(),
            error           : undefined,
            // tree            : undefined
        },
        RunSerially([
            WaitFor(UserInput((state, input) => {
                if (input.type !== 'InitialInput')
                    throw new Error(`Expected 'InitialInput', got '${input.type}'`)
                const current_frame = frame_from_initial_input(input.value)
                return Continue({ ...state, initial_input: input.value, frame_stack: mk_stack(current_frame) })
            })),
            While(({ frame_stack }) => !is_empty_stack(frame_stack), RunSerially([
                Update(check_for_valid_state),
                Update((state) => {
                    const [current_frame, popped_frame_stack] = pop_entry(state.frame_stack as NonEmptyStack<Frame<FM>>)
                    return { ...state, frame_stack: popped_frame_stack, current_frame }
                }),
                WaitFor(UserInput((state, input) => {
                    if (input.type !== 'Tactic')
                        throw new Error(`Expected 'Tactic', got '${input.type}'`)
                    if (!defined(state.current_frame))
                        throw new Error('Current Frame is undefined for some reason!!!')

                    const ts = run_frame_transition(state.current_frame, input.value)
                    if (is_transition_error(ts))
                        return Retry({ ...state, error: ts.e })
                    if (is_transition_result(ts))
                        return Continue(return_result(state, ts.r))
                    if (is_transition_input_request(ts))
                        throw new Error('unimplemented')
                    if (is_combined_transition_result<Frame<FM>, Result>(ts))
                        return SaveThen(Continue(compute_then_return_result(state, ts.frames, operation(ts.frames.length, ts.combiner))))
                    throw new Error
                })),
            ]))
        ])
    )