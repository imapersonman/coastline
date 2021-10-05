import { Ast } from "../lambda_pi/ast"
import { defined } from "../utilities"
import { Substitution } from "./first_order"

export type ThrowingUnifier = (id: string) => Ast
export const throwing_unifier = (u: Substitution) => (id: string) => {
    if (!defined(u[id])) throw new Error(`Unifier (${JSON.stringify(u)}) at id '${id}' is undefined!`)
    return u[id]
}