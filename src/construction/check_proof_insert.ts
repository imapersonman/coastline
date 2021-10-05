import { Ast, MetaVariable, Variable } from "../lambda_pi/ast"
import { type_k } from "../lambda_pi/shorthands"
import { syntactic_equality } from "../lambda_pi/syntactic_equality"
import { mk_map } from "../map/RecursiveMap"
import { Env } from "../logical_framework/env"
import { Sig } from "../logical_framework/sig"
import { display_sort_error, SortError } from "../logical_framework/sort_errors"
import { check_and_report } from "../logical_framework/synthesize_type"
import { apply_relatively_named_ast } from "./apply_relatively_named_ast"
import { ctxs_at_meta_variables } from "./ctxs_at_metavariables"
import { IndexedValue } from "./indexed_value"
import { RelativelyNamedAst } from "./relatively_named_ast"
import { display_sequent, Sequent, sequent, sequents_equal } from "./sequent"
import { ast_to_string as ast_to_string } from "../lambda_pi/utilities"

export class SubProblem { constructor(readonly meta_variable: MetaVariable, readonly sequent: Sequent) {} }
export const is_sub_problem = (s: any): s is SubProblem => s instanceof SubProblem
export const sub_problem = (meta_variable: MetaVariable, sequent: Sequent) => new SubProblem(meta_variable, sequent)
export const sub_problems_equal = (sp1: SubProblem, sp2: SubProblem): boolean =>
    syntactic_equality(sp1.meta_variable, sp2.meta_variable)
    && sequents_equal(sp1.sequent, sp2.sequent)
export const display_sub_problem = (sp: SubProblem): object | string | number => ({
    did: "SubProblem",
    meta_variable: ast_to_string(sp.meta_variable),
    sequent: display_sequent(sp.sequent)
})
export class FailedSubProblem { constructor(readonly meta_variable: MetaVariable, readonly sort_error: SortError) {} }
export const is_failed_sub_problem = (sp: any): sp is FailedSubProblem => sp instanceof FailedSubProblem
export const display_failed_sub_problem = (sp: FailedSubProblem): object => ({
    did: "FailedSubProblem",
    meta_variable: ast_to_string(sp.meta_variable),
    sort_error: display_sort_error(sp.sort_error)
})

export type CheckedProofInsert = ValidProofInsert | InvalidProofInsertWithBadFragment | InvalidProofInsertWithBadNewConclusions
export const is_checked_proof_insert = (c: any): c is CheckedProofInsert =>
    is_valid_proof_insert(c) || is_invalid_proof_insert_with_bad_fragment(c) || is_invalid_proof_insert_with_bad_new_conclusions(c)
export class ValidProofInsert {
    // The MetaVariables used should have a 1-1 correspondence with what would be in used_meta_variables, so I've removed the used_meta_variables list and
    // replaced it with a sub_problems list.  I also removed the new_sequents list.
    constructor(readonly ast: Ast, readonly used_variables: Variable[], readonly sub_problems: SubProblem[]) {}
}
export const is_valid_proof_insert = (v: any): v is ValidProofInsert => v instanceof ValidProofInsert
export const valid_proof_insert = (ast: Ast, used_variables: Variable[], sub_problems: SubProblem[]): ValidProofInsert => new ValidProofInsert(ast, used_variables, sub_problems)
export type InvalidProofInsert = InvalidProofInsertWithBadFragment | InvalidProofInsertWithBadNewConclusions
export const is_invalid_proof_insert = (i: any): i is InvalidProofInsert => is_invalid_proof_insert_with_bad_fragment(i) || is_invalid_proof_insert_with_bad_new_conclusions(i)
export class InvalidProofInsertWithBadFragment { constructor(readonly ast: Ast, readonly sort_error: SortError) {} }
export const is_invalid_proof_insert_with_bad_fragment = (i: any): i is InvalidProofInsertWithBadFragment => i instanceof InvalidProofInsertWithBadFragment
export const display_invalid_proof_insert_with_bad_fragment = (i: InvalidProofInsertWithBadFragment): object => ({
    did: "InvalidProofInsertWithBadFragment",
    ast: ast_to_string(i.ast),
    sort_error: display_sort_error(i.sort_error)
})
export class InvalidProofInsertWithBadNewConclusions { constructor(readonly ast: Ast, readonly sub_problems: (SubProblem | FailedSubProblem)[]) {} }
export const is_invalid_proof_insert_with_bad_new_conclusions = (i: any): i is InvalidProofInsertWithBadNewConclusions => i instanceof InvalidProofInsertWithBadNewConclusions
export const display_invalid_proof_insert_with_bad_new_conclusions = (i: InvalidProofInsertWithBadNewConclusions): object => ({
    did: "InvalidProofInsertWithBadNewConclusions",
    ast: ast_to_string(i.ast),
    sub_problems: i.sub_problems.map((sp) =>
        is_sub_problem(sp) ? display_sub_problem(sp)
        : is_failed_sub_problem(sp) ? display_failed_sub_problem(sp)
        : ({ did: "Nothing" }))
})

export const display_invalid_proof_insert = (i: InvalidProofInsert): object =>
    is_invalid_proof_insert_with_bad_fragment(i) ? display_invalid_proof_insert_with_bad_fragment(i)
    : display_invalid_proof_insert_with_bad_new_conclusions(i)

export const check_proof_insert = (sig: Sig, goal: Sequent, new_conclusions: Ast[], fragment: RelativelyNamedAst, m: IndexedValue<MetaVariable>, v: IndexedValue<Variable>): CheckedProofInsert => {
    // A pro to generating unique variable and meta-variable names internally is that it doesn't require trusting outside name-generating functions.
    const { ast, variables: vs, meta_variables: mvs } = apply_relatively_named_ast(fragment, m, v)
    const ctxs_at_mvs = ctxs_at_meta_variables(ast, mvs)
    let there_exists_a_sort_error = false
    const checked_sub_problems = ctxs_at_mvs.map((ctx, i) => {
        // Every ctx in ctxs_at_mvs is guarunteed to exist based on how apply_relatively_named_ast works, so I don't mind the !.
        const report = check_and_report(new Env(sig, ctx!.union(goal.assumptions), mk_map()), new_conclusions[i], type_k)
        there_exists_a_sort_error = there_exists_a_sort_error || report !== true
        return report === true ? new SubProblem(mvs[i], sequent(ctx!, new_conclusions[i])) : new FailedSubProblem(mvs[i], report)
    })
    if (there_exists_a_sort_error)
        return new InvalidProofInsertWithBadNewConclusions(ast, checked_sub_problems)
    const mvs_map = mk_map(...mvs.map((mv, i): [string, Ast] => [mv.id, new_conclusions[i]]))
    const report = check_and_report(new Env(sig, goal.assumptions, mvs_map), ast, goal.conclusion)
    return report === true ? new ValidProofInsert(ast, vs, checked_sub_problems as SubProblem[]) : new InvalidProofInsertWithBadFragment(ast, report)
}