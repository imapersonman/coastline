import { type_k } from "../lambda_pi/shorthands"
import { mk_map } from "../map/RecursiveMap"
import { display_failed_ctx_check, FailedCtxCheck, is_failed_ctx_check } from "../logical_framework/ctx_errors"
import { Env } from "../logical_framework/env"
import { Sig } from "../logical_framework/sig"
import { display_sort_error, is_sort_error, SortError } from "../logical_framework/sort_errors"
import { check_and_report, check_ctx_and_report } from "../logical_framework/synthesize_type"
import { Sequent } from "./sequent"

export type SequentError = FailedCtxCheck | SortError
export const is_sequent_error = (e: any): e is SequentError => is_failed_ctx_check(e) || is_sort_error(e)
export const display_sequent_error = (se: SequentError): object | string | number =>
    is_failed_ctx_check(se) ? display_failed_ctx_check(se)
    : display_sort_error(se)

export const check_sequent = (sig: Sig, sequent: Sequent): [] | SequentError => {
    const assumptions_report = check_ctx_and_report(sig, sequent.assumptions)
    if (is_failed_ctx_check(assumptions_report))
        return assumptions_report
    const conclusion_report = check_and_report(new Env(sig, sequent.assumptions, mk_map()), sequent.conclusion, type_k)
    if (is_sort_error(conclusion_report))
        return conclusion_report
    return []
}