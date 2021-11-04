import { Sequent } from "./sequent"
import { Request } from "./request"
import { Insert } from "./insert"
import { UserError } from "./user_error"
import { TacticError } from "./tactic_error"

export type TacticGen<Parameter> = Generator<Request<Parameter>, Insert | TacticError | UserError<any>, any>
export type Tactic<Parameter> = (s: Sequent) => TacticGen<Parameter>