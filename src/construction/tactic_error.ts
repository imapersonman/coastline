// A TacticError represents an error that occurred as a result of a tactic writer's mistake, and therefore shouldn't be shown completely to the user.
// Ideally, such an error would be logged somewhere.
export class TacticError { constructor(readonly message: string) {} }
export const is_tactic_error = (e: any): e is TacticError => e instanceof TacticError
export const tactic_error = (message: string): TacticError => new TacticError(message)