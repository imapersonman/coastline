import { Variable } from "../lambda_pi/ast"
import { bound_variables } from "../lambda_pi/bound_variables"
import { Ctx } from "../logical_framework/ctx"
import { Sequent } from "./sequent"

const bound_variables_in_ctx = (c: Ctx): Variable[] => {
    return [...new Set([...c.entries().reduce<Variable[]>((acc, [,type]) => [...acc, ...bound_variables(type)], [])])]
}

export const bound_variables_in_sequent = (s: Sequent): Variable[] => {
    return [...new Set([...bound_variables_in_ctx(s.assumptions), ...bound_variables(s.conclusion)])]
}