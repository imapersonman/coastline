import { isEqual } from "lodash";
import { Ast } from "../lambda_pi/ast";
import { imv, iv } from "../lambda_pi/shorthands";
import { ast_to_string } from "../lambda_pi/utilities";
import { Env } from "../logical_framework/env";
import { Sort } from "../logical_framework/sort";
import { display_sort_error, is_sort_error, SortError } from "../logical_framework/sort_errors";
import { check_and_report } from "../logical_framework/synthesize_type";
import { mk_map } from "../map/RecursiveMap";
import { defined } from "../utilities";
import { check_proof_insert, display_invalid_proof_insert, is_valid_proof_insert } from "./check_proof_insert";
import { is_insert } from "./insert";
import { Sequent } from "./sequent";
import { Tactic } from "./tactic";
import { is_tactic_error, TacticError } from "./tactic_error";
import { is_user_error, UserError } from "./user_error";
import { VerifiedInteractionSpecification } from "./verified_interaction_specification";

export interface VerifiedInteractionSpecificationTests {
    proof_tests: {
        valid: { test_name: string, proof: Ast, sort: Sort }[],
        invalid: { test_name: string, proof: Ast, error: SortError }[]
    },
    tactic_tests: {
        id: string,
        // A Valid Tactic Test is just a sequent followed by 0 or more responses.
        // The test passes if the Tactic returns a valid proof insert that checks against the given sequent after the responses are all run.
        // Each entry 
        valid: { test_name: string, sequent: Sequent, responses: any[] }[],
        // An Invalid Tactic Test is a sequent followed by 0 or more responses followed by the user_error that ought to be returned after all the
        // responses are run.
        invalid: { test_name: string, sequent: Sequent, responses: any[], error: UserError }[]
    }[],
    request_tests: {
        id: string,
        invalid_parameters: {
            test_name: string,
            parameter: any,
            error: UserError | TacticError
        }[]
        valid: {
            test_name: string,
            parameter: any,
            transformed_parameter: any,
            invalid_responses: {
                test_name: string,
                response: any,
                error: UserError
            }[],
            valid: {
                test_name: string,
                response: any,
                transformed_response: any
            }[]
        }[]
    }[],
    error_tests: {
        id: string,
        valid: { test_name: string, payload: any }[],
        invalid: { test_name: string, payload: any }[]
    }[]
}

export const generate_successful_verified_interaction_specification_test = (vmts: VerifiedInteractionSpecificationTests) => {
    return {
        proof_tests: {
            valid: vmts.proof_tests.valid.map(({ test_name }) => ({ test_name, result: "PASSED" })),
            invalid: []
        },
        tactic_tests: vmts.tactic_tests.map(({ id, valid, invalid }) => ({
            id,
            valid: valid.map(({ test_name }) => ({ test_name, result: "PASSED" })),
            invalid: invalid.map(({ test_name }) => ({ test_name, result: "PASSED" }))
        })),
        request_tests: vmts.request_tests.map(({ id, invalid_parameters, valid }) => ({
            id,
            invalid_parameters: invalid_parameters.map(({ test_name }) => ({ test_name, result: "PASSED" })),
            valid: valid.map(({ test_name, invalid_responses, valid }) => ({
                test_name,
                result: "PASSED",
                invalid_responses: invalid_responses.map(({ test_name }) => ({ test_name, result: "PASSED" })),
                valid: valid.map(({ test_name }) => ({ test_name, result: "PASSED" }))
            }))
        })),
        error_tests: vmts.error_tests.map(({ id, valid, invalid }) => ({
            id,
            valid: valid.map(({ test_name }) => ({ test_name, result: "PASSED" })),
            invalid: invalid.map(({ test_name }) => ({ test_name, result: "PASSED" }))
        }))
    }
}

export const generate_tested_verified_interaction_specification_test = (vms: VerifiedInteractionSpecification, vmts: VerifiedInteractionSpecificationTests) => {
    const run_tactic_test_without_checking = (tactic: Tactic<any>, sequent: Sequent, responses: any[]) => {
        // run tactic with sequent
        const tactic_it = tactic(sequent)
        // should be either the initial 
        let finished_or_simple_request = tactic_it.next()
        let rs = responses
        // while the tactic keeps yielding requests, check the response and hand it back to the tactic if it checks properly
        // I have to be explicit with "=== false" or else the type-checker gets confused
        while (finished_or_simple_request.done === false) {
            // Just freak out if the test is malformed and we don't have enough responses
            // finished_or_simple_request is a simple_request at this point
            const req = finished_or_simple_request.value
            const transform = vms.requests[req.id]
            const parameter = req.parameter
            const transformed_parameter = transform.parameter(parameter)
            if (is_user_error(transformed_parameter) || is_tactic_error(transformed_parameter))
                return transformed_parameter
            const response = rs[0]
            const transformed_response = transform.response({ p: parameter, tp: transformed_parameter, r: response })
            rs = rs.slice(1)
            finished_or_simple_request = tactic_it.next(transformed_response)
        }
        // Freak out if for some reason we have too many responses, as this is either the sign of an error or a poorly thought-out test
        if (rs.length !== 0)
            throw new Error(`Not all responses were consumed: ${JSON.stringify(finished_or_simple_request.value)}`)
        return finished_or_simple_request.value
    }
    return {
        proof_tests: {
            valid: vmts.proof_tests.valid.map(({ test_name, proof, sort }) => {
                const env = new Env(vms.sig, mk_map(), mk_map())
                const report = check_and_report(env, proof, sort)
                if (is_sort_error(report))
                    return { test_name, result: "FAILED", proof: ast_to_string(proof), expected_sort: ast_to_string(sort), sort_error: display_sort_error(report) }
                return { test_name, result: "PASSED" }
            }),
            // loop through vmts.proof_tests.invalid and make sure none of them type-check under vms.sig
            // I'll do it later
            invalid: []
        },
        tactic_tests: vmts.tactic_tests.map(({ id, valid, invalid }) => {
            const tactic = vms.tactics[id]
            if (!defined(tactic)) throw new Error(`Can't find tactic with id '${id}'`)
            return {
                id,
                valid: valid.map(({ test_name, sequent, responses }) => {
                    const tr = run_tactic_test_without_checking(tactic, sequent, responses)
                    if (!is_insert(tr))
                        return { test_name, result: "FAILED_WITH_NON_INSERT", actual: tr }
                    const check = check_proof_insert(vms.sig, sequent, tr.new_conclusions, tr.fragment, imv, iv)
                    if (!is_valid_proof_insert(check))
                        return { test_name, result: "FAILED_VALID_PROOF_INSERT_CHECK", error: display_invalid_proof_insert(check) }
                    return { test_name, result: "PASSED" }
                }),
                invalid: invalid.map(({ test_name, sequent, responses, error }) => {
                    const tr = run_tactic_test_without_checking(tactic, sequent, responses)
                    if (!is_tactic_error(tr) && !is_user_error(tr))
                        return { test_name, result: "FAILED_WITH_NON_ERROR", expected: error, actual: tr }
                    if (!isEqual(tr, error))
                        return { test_name, result: "FAILED", actual: tr, expected: error }
                    return { test_name, result: "PASSED" }
                })
            }
        }),
        request_tests: vmts.request_tests.map(({ id, invalid_parameters, valid }) => {
            const transform = vms.requests[id]
            if (!defined(transform)) throw new Error(`Can't find request at id '${id}'`)
            return {
                id,
                invalid_parameters: invalid_parameters.map(({ test_name, parameter, error }) => {
                    const tp = transform.parameter(parameter)
                    if (!isEqual(tp, error))
                        return {
                            test_name,
                            result: "FAILED",
                            expected: error,
                            actual: tp
                        }
                    return { test_name, result: "PASSED", }
                }),
                valid: valid.map(({ test_name, parameter, transformed_parameter, invalid_responses, valid }) => {
                    const tp = transform.parameter(parameter)
                    if (!isEqual(tp, transformed_parameter))
                        return {
                            test_name,
                            result: "FAILED",
                            expected: transformed_parameter,
                            actual: tp
                        }
                    return {
                        test_name,
                        result: "PASSED",
                        invalid_responses: invalid_responses.map(({ test_name, response, error }) => {
                            const tr = transform.response({ p: parameter, tp: transformed_parameter, r: response })
                            if (!isEqual(tr, error))
                                return {
                                    test_name,
                                    result: "FAILED",
                                    expected: error,
                                    actual: tr
                                }
                            return { test_name, result: "PASSED" }
                        }),
                        valid: valid.map(({ test_name, response, transformed_response }) => {
                            const tr = transform.response({ p: parameter, tp: transformed_parameter, r: response })
                            if (!isEqual(tr, transformed_response))
                                return {
                                    test_name,
                                    result: "FAILED",
                                    expected: transformed_response,
                                    actual: tr
                                }
                            return { test_name, result: "PASSED" }
                        })
                    }
                })
            }
        }),
        error_tests: vmts.error_tests.map(({ id, valid, invalid }) => {
            const error_def = vms.errors[id]
            if (!defined(error_def))
                throw new Error(`Can't find error at id '${id}'`)
            return {
                id,
                valid: valid.map(({ test_name, payload }) => ({
                    test_name,
                    result: error_def(payload) ? "PASSED" : "FAILED"
                })),
                invalid: invalid.map(({ test_name, payload }) => ({
                    test_name,
                    result: !error_def(payload) ? "PASSED" : "FAILED"
                }))
            }
        })
    }
}