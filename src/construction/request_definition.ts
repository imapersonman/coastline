import { TacticError } from "./tactic_error";
import { UserError } from "./user_error";

export interface RequestDefinition<Parameter, TransformedParameter, Response, TransformedResponse> {
    // The "| any" is appended to the Parameter type to indicate to the RequestDefinition author that they
    // must check to ensure they actually have the parameter they expect.
    parameter: (p: Parameter | any) => TacticError | UserError<any> | TransformedParameter
    response: (po: { p: Parameter, tp: TransformedParameter, r: Response | any }) => UserError<any> | TransformedResponse
}

// Helpful for type-checking when specifying a RequestDefinition.
export const request_definition = <P, TP, R, TR>(rd: RequestDefinition<P, TP, R, TR>): RequestDefinition<P, TP, R, TR> => rd