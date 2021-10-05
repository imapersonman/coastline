// A UserError represents an error that occurred as a result of a user's mistake, and should therefore give the user enough information to correct the error.
// Any user-facing code needs to be able be able to identify the payload by the UserError's id, so such code needs to register possible UserErrors somewhere.
export class UserError { constructor(readonly id: string, readonly payload: any) {} }
export const is_user_error = (e: any): e is UserError => e instanceof UserError
export const user_error = (id: string, payload?: any): UserError => new UserError(id, payload)