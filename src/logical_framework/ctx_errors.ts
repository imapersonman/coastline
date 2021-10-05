import { display_redeclared_variable, display_sort_error, is_redeclared_variable, RedeclaredVariable, SortError } from "./sort_errors";

export type FailedCtxCheck = BadEntry | RedeclaredVariable
export const is_failed_ctx_check = (f: any): f is FailedCtxCheck => is_bad_entry(f) || is_redeclared_variable(f)
export class BadEntry { constructor(readonly id: string, readonly sort_error: SortError) {} }
export const is_bad_entry = (b: any): b is BadEntry => b instanceof BadEntry
export const display_bad_entry = (b: BadEntry): object => ({
    did: "BadEntry",
    id: b.id,
    sort_error: display_sort_error(b.sort_error)
})
export const display_failed_ctx_check = (f: FailedCtxCheck): object =>
    is_bad_entry(f) ? display_bad_entry(f)
    : is_redeclared_variable(f) ? display_redeclared_variable(f)
    : { did: "Nothing" }