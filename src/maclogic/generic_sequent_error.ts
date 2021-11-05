export class ErrorInAssumptions<E> { constructor(readonly error: E, readonly index: number) {} }
export const is_error_in_assumptions = (e: unknown): e is ErrorInAssumptions<unknown> => e instanceof ErrorInAssumptions
export class ErrorInConclusion<E> { constructor(readonly error: E) {} }
export const is_error_in_conclusion = (e: unknown): e is ErrorInConclusion<unknown> => e instanceof ErrorInConclusion
export type SequentError<E> = ErrorInAssumptions<E> | ErrorInConclusion<E>
export const is_sequent_error = (s: unknown): s is SequentError<unknown> =>
    is_error_in_assumptions(s) || is_error_in_conclusion(s)

