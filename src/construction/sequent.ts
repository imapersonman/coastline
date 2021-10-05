import { Ast } from "../lambda_pi/ast";
import { syntactic_equality } from "../lambda_pi/syntactic_equality";
import { Ctx } from "../logical_framework/ctx";
import { zip } from "../utilities";
import { ast_to_string as ast_to_string, is_ast } from "../lambda_pi/utilities"
import { RecursiveMap } from "../map/RecursiveMap";

export interface Sequent { assumptions: Ctx, conclusion: Ast }
export const sequent = (assumptions: Ctx, conclusion: Ast): Sequent => ({ assumptions, conclusion })
export const is_sequent = (s: any): s is Sequent => s.assumptions !== undefined && s.assumptions instanceof RecursiveMap && is_ast(s.conclusion)
export const sequents_equal = (s1: Sequent, s2: Sequent): boolean =>
    zip(s1.assumptions.entries(), s2.assumptions.entries()).every(([[id1, type1], [id2, type2]]) => id1 === id2 && syntactic_equality(type1, type2))
export const display_sequent = (s: Sequent): object | string | number => ({
    assumptions: s.assumptions.entries().map(([id, type]) => `${id}: ${ast_to_string(type)}`),
    conclusion: ast_to_string(s.conclusion)
})