import { GeneratedVariable } from "../lambda_pi/ast"
import { next_indexed_variable } from "../lambda_pi/next_indexed_variable"
import { iv } from "../lambda_pi/shorthands"
import { next_indexed_variable_in_ctx } from "../logical_framework/next_indexed_variable_in_ctx"
import { Sequent } from "./sequent"

export const next_indexed_variable_in_sequent = (sequent: Sequent): GeneratedVariable =>
    iv(Math.max(
        next_indexed_variable_in_ctx(sequent.assumptions).get_index(),
        next_indexed_variable(sequent.conclusion).get_index()))