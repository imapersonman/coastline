import { check_proof_insert, display_invalid_proof_insert, InvalidProofInsert, is_valid_proof_insert, SubProblem, sub_problem, ValidProofInsert } from "./check_proof_insert";
import { check_sequent, is_sequent_error, SequentError } from "./check_sequent";
import { is_sequent, sequent, Sequent } from "./sequent";
import { Tactic } from "./tactic";
import { is_user_error, UserError } from "./user_error";
import { is_request, Request } from "./request"
import { is_tactic_error, TacticError } from "./tactic_error";
import { Sig } from "../logical_framework/sig";
import { defined, is_any, is_number, is_string } from "../utilities";
import { Insert } from "./insert";
import { GeneratedVariable, IndexedMetaVariable } from "../lambda_pi/ast";
import { imv, iv } from "../lambda_pi/shorthands";
import { isEmpty } from "lodash";
import { VerifiedInteractionSpecification } from "./verified_interaction_specification";
import { next_indexed_variable_in_sequent } from "./next_indexed_variable_in_sequent";
import { mk_map } from "../map/RecursiveMap";

export interface EmitEvent<Event> {
    user_gave_bad_main_problem: (data: { main_problem: Sequent, main_problem_error: SequentError }) => Event
    user_gave_main_problem: (data: { main_problem: Sequent }) => Event
    user_gave_bad_tactic: (data: { tactic_id: string }) => Event
    user_gave_tactic: (data: { id: string, tactic: Tactic<any> }) => Event
    user_gave_sub_problem: (data: { id: number, sub_problem: SubProblem }) => Event
    user_gave_bad_sub_problem: (data: { id: string }) => Event,
    started_tactic: (data: { tactic_id: string, tactic: Tactic<any>, sub_problem: SubProblem }) => Event
    user_messed_up: (data: { user_error: UserError<any> }) => Event
    tactic_has_made_request: (data: { request: Request<any>, transformed_parameter: any }) => Event
    user_responded_to_request: (data: { response: any, transformed_response: any }) => Event
    finished_tactic: (data: { sub_problem_id: number, valid_proof_insert: ValidProofInsert }) => Event,
    finished_main_problem: (data: { main_problem: Sequent }) => Event
}

export interface Expect<Expectation> {
    user_to_give_main_problem: () => Expectation
    user_to_give_tactic_or_sub_problem_id: (data: { gave_tactic_or_sub_problem: 'TacticId' | 'SubProblemId' | undefined, sub_problems: Record<number, SubProblem> }) => Expectation
    user_to_respond_to_request: (data: { request: Request<any>, transformed_parameter: any }) => Expectation
}

// Every exception returns a string so that it can be passed into typescript's Error constructor.
export interface Exceptions {
    tactic_error: (te: TacticError) => string
    invalid_user_error_id: (uid: string) => string
    invalid_user_error_payload: (ue: UserError<any>) => string
    invalid_request_id: (rid: string) => string
    invalid_proof_insert: (ipi: InvalidProofInsert) => string
}

export type UserExpectationKeys = keyof Expect<unknown>
export class UserExpectation<Key extends UserExpectationKeys> {
    constructor(readonly expectation: Key, readonly data: Parameters<Expect<unknown>[Key]>[0]) {}
}
export const is_user_expectation = <E extends UserExpectationKeys>(u: unknown): u is UserExpectation<E> => u instanceof UserExpectation

export type ConstructorEventKeys = keyof EmitEvent<unknown>
export class ConstructorEvent<Key extends ConstructorEventKeys> {
    constructor(readonly event: Key, readonly data: Parameters<EmitEvent<unknown>[Key]>[0]) {}
}
export const is_constructor_event = <E extends ConstructorEventKeys>(c: unknown): c is ConstructorEvent<E> => c instanceof ConstructorEvent

export type ExpectedInput =
    | { type: 'TacticId', value: string }
    | { type: 'SubProblemId', value: number }
    | { type: 'MainProblem', value: Sequent }
    | { type: 'Response', value: any }

const expected_input_guards: Record<ExpectedInput["type"], (v: any) => v is ExpectedInput["value"]> = {
    TacticId: is_string,
    SubProblemId: is_number,
    MainProblem: is_sequent,
    Response: is_any
}

export const default_expect: Expect<UserExpectation<UserExpectationKeys>> = {
    user_to_give_main_problem: () =>
        new UserExpectation('user_to_give_main_problem', undefined),
    user_to_give_tactic_or_sub_problem_id: ({ gave_tactic_or_sub_problem, sub_problems }) =>
        new UserExpectation('user_to_give_tactic_or_sub_problem_id', { gave_tactic_or_sub_problem, sub_problems }),
    user_to_respond_to_request: ({ request, transformed_parameter }) =>
        new UserExpectation('user_to_respond_to_request', { request, transformed_parameter })
}

export const default_emit: EmitEvent<ConstructorEvent<ConstructorEventKeys>> = {
    user_gave_bad_main_problem: ({ main_problem, main_problem_error }) =>
        new ConstructorEvent('user_gave_bad_main_problem', { main_problem, main_problem_error }),
    user_gave_main_problem: ({ main_problem }) =>
        new ConstructorEvent('user_gave_main_problem', { main_problem }),
    user_gave_bad_tactic: ({ tactic_id }) =>
        new ConstructorEvent('user_gave_bad_tactic', { tactic_id }),
    user_gave_tactic: ({ id, tactic }) =>
        new ConstructorEvent('user_gave_tactic', { id, tactic }),
    user_gave_bad_sub_problem: ({ id }) =>
        new ConstructorEvent('user_gave_bad_sub_problem', { id }),
    user_gave_sub_problem: ({ id, sub_problem }) =>
        new ConstructorEvent('user_gave_sub_problem', { id, sub_problem }),
    started_tactic: ({ tactic_id, tactic, sub_problem }) =>
        new ConstructorEvent('started_tactic', { tactic_id, tactic, sub_problem }),
    user_messed_up: ({ user_error }) =>
        new ConstructorEvent('user_messed_up', { user_error }),
    tactic_has_made_request: ({ request, transformed_parameter }) =>
        new ConstructorEvent('tactic_has_made_request', { request, transformed_parameter }),
    user_responded_to_request: ({ response, transformed_response }) =>
        new ConstructorEvent('user_responded_to_request', { response, transformed_response }),
    finished_tactic: ({ sub_problem_id, valid_proof_insert }) =>
        new ConstructorEvent('finished_tactic', { sub_problem_id, valid_proof_insert }),
    finished_main_problem: ({ main_problem }) =>
        new ConstructorEvent('finished_main_problem', { main_problem }),
}

export const default_exceptions = {
    tactic_error: (te: TacticError) => `Tactic Error:\n${JSON.stringify(te)}`,
    invalid_user_error_id: (uid: string) => `Invalid User Error Id:\n${JSON.stringify(uid)}`,
    invalid_user_error_payload: <Payload>(ue: UserError<Payload>) => `Invalid User Error Payload:\n${JSON.stringify(ue)}`,
    invalid_request_id: (rid: string) => `Invalid Request Id:\n${JSON.stringify(rid)}`,
    invalid_proof_insert: (ipi: InvalidProofInsert) => `Invalid Proof Insert:\n${JSON.stringify(display_invalid_proof_insert(ipi), null, 2)}`,
}

export function* get_valid_main_problem_from_user(sig: Sig, expect: Expect<any>, emit_event: EmitEvent<any>) {
    let main_problem = check_input(yield expect.user_to_give_main_problem()).value
    let main_problem_error = check_sequent(sig, main_problem)

    while (is_sequent_error(main_problem_error)) {
        yield emit_event.user_gave_bad_main_problem({ main_problem, main_problem_error })
        main_problem = check_input(yield expect.user_to_give_main_problem()).value
        main_problem_error = check_sequent(sig, main_problem)
    }

    yield emit_event.user_gave_main_problem({ main_problem })
    return main_problem
}

export function* emit_defined_or_undefined<K extends number | string | symbol, V>(map: Record<K, V>, key: K, emit_defined, emit_undefined): Generator<any, V | undefined> {
    const value = map[key]
    if (defined(value))
        yield emit_defined(key, value)
    else
        yield emit_undefined(key)
    return value
}

const input_types = ['SubProblemId', 'TacticId', 'MainProblem', 'Response']
const check_input = (input: any): ExpectedInput => {
    if (!defined(input))
        throw new Error("User Input is undefined")
    if (!defined(input.type))
        throw new Error(`User Input type is undefined: ${JSON.stringify(input)}`)
    if (!input_types.some((t) => input.type === t))
        throw new Error(`User Input type must be one of the following: ${input_types}\nInput${JSON.stringify(input)}`)
    if (!defined(input.value))
        throw new Error(`User Input value is undefined`)
    if (!expected_input_guards[input.type](input.value))
        throw new Error(`Failed User Input type check for type '${input.type}': ${JSON.stringify(input.value)}`)
    return input
}

export function* get_user_selected_tactic_and_sub_problem(tactics: Record<string, Tactic<any>>, sub_problems: Record<number, SubProblem>, emit_event: EmitEvent<any>, expect: Expect<any>): Generator<any, [string, Tactic<any>, number, SubProblem], any> {
    let tactic_id: string | undefined = undefined
    let tactic: Tactic<any> | undefined = undefined
    let sub_problem_id: number | undefined = undefined
    let selected_sub_problem: SubProblem | undefined = undefined

    let gave_tactic_or_sub_problem: 'TacticId' | 'SubProblemId' | undefined = undefined
    // type-checker isn't letting me user 'defined' here for some reason.
    while (!(tactic_id !== undefined && tactic !== undefined && sub_problem_id !== undefined && selected_sub_problem !== undefined)) {
        const tactic_or_sub_problem_id = check_input(yield expect.user_to_give_tactic_or_sub_problem_id({ gave_tactic_or_sub_problem, sub_problems }))
        if (tactic_or_sub_problem_id.type === "TacticId") {
            gave_tactic_or_sub_problem = 'TacticId'
            tactic_id = tactic_or_sub_problem_id.value
            tactic = yield* emit_defined_or_undefined<string, Tactic<any>>(tactics, tactic_or_sub_problem_id.value, emit_event.user_gave_tactic, emit_event.user_gave_bad_tactic)
        } else {
            gave_tactic_or_sub_problem = 'SubProblemId'
            sub_problem_id = tactic_or_sub_problem_id.value
            selected_sub_problem = yield* emit_defined_or_undefined(sub_problems, tactic_or_sub_problem_id.value, emit_event.user_gave_sub_problem, emit_event.user_gave_bad_sub_problem)
        }
    }

    return [tactic_id, tactic, sub_problem_id, selected_sub_problem]
}

export function* notify_user_about_error(payload_guards: Record<string, (payload: any) => boolean>, user_error: UserError<any>, emit_event: EmitEvent<any>, exceptions: Exceptions) {
    const payload_is_valid = payload_guards[user_error.id]
    if (!defined(payload_is_valid))
        throw new Error(exceptions.invalid_user_error_id(user_error.id))
    else if (!payload_is_valid(user_error.payload))
        throw new Error(exceptions.invalid_user_error_payload(user_error))
    else
        yield emit_event.user_messed_up({ user_error })
}

export function* run_response_interaction<Y>(
    request: Request<any>,
    transformed_parameter: any,
    response_transformer: (p: { p: any, tp: any, r: any }) => any,
    user_error_payload_guards: Record<string, (payload: any) => boolean>,
    emit_event: EmitEvent<any>,
    expect: Expect<Y>,
    exceptions: Exceptions
): Generator<Y, [any, any], any> {
    yield emit_event.tactic_has_made_request({ request, transformed_parameter })
    let response = check_input(yield expect.user_to_respond_to_request({ request, transformed_parameter })).value
    let transformed_response = response_transformer({ p: request.parameter, tp: transformed_parameter, r: response })
    while (is_user_error(transformed_response)) {
        yield* notify_user_about_error(user_error_payload_guards, transformed_response, emit_event, exceptions)
        response = check_input(yield expect.user_to_respond_to_request({ request, transformed_parameter })).value
        transformed_response = response_transformer({ p: request.parameter, tp: transformed_parameter, r: response })
    }
    return [response, transformed_response]
}

export function* notify_user_about_insert(
    sig: Sig,
    sp: SubProblem,
    insert: Insert,
    m: (i: number) => IndexedMetaVariable,
    v: (i: number) => GeneratedVariable,
    emit_event: EmitEvent<any>,
    exceptions: Exceptions
): Generator<any, ValidProofInsert, any> {
    const checked_proof_insert = check_proof_insert(sig, mk_map(), sp.sequent, insert.new_conclusions, insert.fragment, m, v)
    if (!is_valid_proof_insert(checked_proof_insert))
        throw new Error(exceptions.invalid_proof_insert(checked_proof_insert))
    yield emit_event.finished_tactic({ sub_problem_id: sp.meta_variable.get_index(), valid_proof_insert: checked_proof_insert })
    return checked_proof_insert
}

// There is a major issue with the following function why am I so sleepy all of a sudden.
// That's not the issue.
// The issue lies in the fact that both events and user expectarions are yielded to the function caller.
// This is good for testing, but awkward in practice since the code surrounding events should continue unimpeded by default.
// As it is now, the UI must manually keep calling 'next' until an Expectation is yielded.
// SUMMARY: event handlers should be called, not yielded, while expectations should be yielded.

// Should the emitted events be blocking?
// One way of thinking about this is as follows:
// - Expectations are blocking (can't continue until required data is given);
// - Emitted events are non-blocking.
export function mk_run_interaction<Exp, Emi>(expect: Expect<Exp>, emit_event: EmitEvent<Emi>, exceptions: Exceptions): (spec: VerifiedInteractionSpecification) => Generator<Exp | Emi, void, unknown> {
    return function* (spec: VerifiedInteractionSpecification) {
        const main_problem = yield* get_valid_main_problem_from_user(spec.sig, expect, emit_event)
        let sub_problems: Record<number, SubProblem> = { 0: sub_problem(imv(0), main_problem) }
        let next_mv_index = 1
        let next_ov_index = next_indexed_variable_in_sequent(main_problem).get_index()
        const m = (i: number): IndexedMetaVariable => imv(i + next_mv_index)
        const v = (i: number): GeneratedVariable => iv(i + next_ov_index)

        while (!isEmpty(sub_problems)) {
            const [tactic_id, tactic, sub_problem_id, current_sub_problem] = yield* get_user_selected_tactic_and_sub_problem(spec.tactics, sub_problems, emit_event, expect)
            yield emit_event.started_tactic({ tactic_id, tactic, sub_problem: current_sub_problem })

            let tactic_gen = tactic(current_sub_problem.sequent)
            let tactic_state_it = tactic_gen.next()

            while (is_request(tactic_state_it.value)) {
                const request = tactic_state_it.value
                const request_definition = spec.requests[request.id]
                if (!defined(request_definition))
                    throw new Error(exceptions.invalid_request_id(request.id))
                const transformed_parameter = request_definition.parameter(request.parameter)
                if (is_user_error(transformed_parameter))
                    yield* notify_user_about_error(spec.errors, transformed_parameter, emit_event, exceptions)
                else {
                    const [response, transformed_response] = yield* run_response_interaction(request, transformed_parameter, request_definition.response, spec.errors, emit_event, expect, exceptions)
                    yield emit_event.user_responded_to_request({ response, transformed_response })
                    tactic_state_it = tactic_gen.next(transformed_response)
                }
            }

            if (is_tactic_error(tactic_state_it.value))
                throw new Error(exceptions.tactic_error(tactic_state_it.value))
            if (is_user_error(tactic_state_it.value))
                yield* notify_user_about_error(spec.errors, tactic_state_it.value, emit_event, exceptions)
            else {
                const checked_proof_insert = yield* notify_user_about_insert(spec.sig, current_sub_problem, tactic_state_it.value, m, v, emit_event, exceptions)
                const parent = sub_problems[(sub_problem_id as number)]
                delete sub_problems[(sub_problem_id as number)]
                for (const sp of checked_proof_insert.sub_problems) {
                    const new_sequent = sequent(sp.sequent.assumptions.union(parent.sequent.assumptions), sp.sequent.conclusion)
                    sub_problems[sp.meta_variable.get_index()] = sub_problem(sp.meta_variable, new_sequent)
                }
                next_mv_index++
                next_ov_index++
            }
        }

        // We doneeee!
        yield emit_event.finished_main_problem(main_problem)
        // return main_problem
    }
}

export const run_interaction = mk_run_interaction(default_expect, default_emit, default_exceptions)