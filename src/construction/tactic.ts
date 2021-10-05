import { Sequent } from "./sequent"
import { Request } from "./request"
import { Insert } from "./insert"
import { UserError } from "./user_error"

export type TacticGen<Parameter> = Generator<Request<Parameter>, Insert | UserError, any>
export type Tactic<Parameter> = (s: Sequent) => TacticGen<Parameter>