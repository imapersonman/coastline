import { binders_of_type_similar } from "../lambda_pi/alpha-equality"
import { Application, Ast, Constant, MetaVariable, Variable } from "../lambda_pi/ast"
import { beta_eta_equality } from "../lambda_pi/beta_eta_equality"
import { Binder, is_application, is_binder, is_constant, is_meta_variable, is_variable } from "../lambda_pi/utilities"
import { AddConflictingSubstitutionEntry, simply_add_to_substitution, Substitution } from "./first_order"

export class LeftConstantDoesNotMatchRight { constructor(readonly l: Constant | Variable, readonly r: Ast) {} }
export const is_left_constant_does_not_match_right = (e: unknown): e is LeftConstantDoesNotMatchRight => e instanceof LeftConstantDoesNotMatchRight
export class RedeclaredMatchVariable { constructor(readonly v: MetaVariable, readonly previous_value: Ast, readonly new_value: Ast) {} }
export const is_redeclared_match_variable = (e: unknown): e is RedeclaredMatchVariable => e instanceof RedeclaredMatchVariable
export class ApplicationHeadError { constructor(readonly head_error: MatchError, readonly arg_match_or_error: Substitution | MatchError) {} }
export const is_application_head_error = (e: unknown): e is ApplicationHeadError => e instanceof ApplicationHeadError
export class ApplicationArgError { constructor(readonly head_match: Substitution, readonly arg_error: MatchError) {} }
export const is_application_arg_error = (e: unknown): e is ApplicationArgError => e instanceof ApplicationArgError
export class LeftApplicationDoesNotMatchRight { constructor(readonly l: Application, readonly r: Ast) {} }
export const is_left_application_does_not_match_right = (e: unknown): e is LeftApplicationDoesNotMatchRight => e instanceof LeftApplicationDoesNotMatchRight
export class LeftAndRightAreDifferentBinders { constructor(readonly l: Binder, r: Binder) {} }
export const is_left_and_right_are_different_binders = (e: unknown): e is LeftAndRightAreDifferentBinders => e instanceof LeftAndRightAreDifferentBinders
export class BinderTypeError { constructor(readonly type_error: MatchError, readonly scope_match_or_error: Substitution | MatchError) {} }
export const is_binder_type_error = (e: unknown): e is BinderTypeError => e instanceof BinderTypeError
export class BinderScopeError { constructor(readonly type_match: Substitution, readonly scope_error: MatchError) {} }
export const is_binder_scope_error = (e: unknown): e is BinderScopeError => e instanceof BinderScopeError
export type MatchError =
    | LeftConstantDoesNotMatchRight
    | RedeclaredMatchVariable
    | ApplicationHeadError
    | ApplicationArgError
    | LeftApplicationDoesNotMatchRight
    | LeftAndRightAreDifferentBinders
    | BinderTypeError
    | BinderScopeError
export const is_match_error = (e: unknown): e is MatchError =>
    is_left_constant_does_not_match_right(e)
    || is_redeclared_match_variable(e)
    || is_application_head_error(e)
    || is_application_arg_error(e)
    || is_left_application_does_not_match_right(e)
    || is_left_and_right_are_different_binders(e)
    || is_binder_type_error(e)
    || is_binder_scope_error(e)

export const match = (l: Ast, r: Ast): Substitution | MatchError => {
    const match_acc = (bound: Variable[], sub: Substitution, l: Ast, r: Ast): Substitution | MatchError => {
        if (is_constant(l) || is_variable(l))
            return beta_eta_equality(l, r) ? sub : new LeftConstantDoesNotMatchRight(l, r)
        if (is_meta_variable(l)) {
            const mod_sub = simply_add_to_substitution(sub, l.id, r)
            if (mod_sub instanceof AddConflictingSubstitutionEntry)
                return new RedeclaredMatchVariable(l, sub[l.id], r)
            return mod_sub
        }
        if (is_application(l)) {
            if (is_application(r)) {
                const head_sub = match_acc(bound, sub, l.head, r.head)
                if (is_match_error(head_sub))
                    return new ApplicationHeadError(head_sub, match_acc(bound, sub, l.arg, r.arg))
                const arg_sub = match_acc(bound, head_sub, l.arg, r.arg)
                if (is_match_error(arg_sub))
                    return new ApplicationArgError(head_sub, arg_sub)
                return arg_sub
            }
            return new LeftApplicationDoesNotMatchRight(l, r)
        }
        if (is_binder(l) && is_binder(r)) {
            const cool = binders_of_type_similar(
                new LeftAndRightAreDifferentBinders(l, r),
                (bound, type1, type2) => match_acc(bound, sub, type1, type2),
                (bound, types_sub, scope1, scope2) => {
                    if (is_match_error(types_sub))
                        return new BinderTypeError(types_sub, match_acc(bound, sub, scope1, scope2))
                    const scopes_sub = match_acc(bound, types_sub, scope1, scope2)
                    if (is_match_error(scopes_sub))
                        return new BinderScopeError(types_sub, scopes_sub)
                    return scopes_sub
                }
            )(l, r, bound)
        }
        throw new Error('')
    }
    return match_acc([], {}, l, r)
}