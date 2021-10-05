import { Ast } from "../lambda_pi/ast"
import { ast_to_string } from "../lambda_pi/utilities"
import { display_sort, Sort } from "./sort"

export abstract class SortError { constructor(readonly subject: Ast) {} }
export const is_sort_error = (s: any): s is SortError => s instanceof SortError
export const display_sort_error = (se: SortError): object | string | number =>
    is_undeclared_constant(se) ? display_undeclared_constant(se)
    : is_undeclared_variable(se) ? display_undeclared_variable(se)
    : is_undeclared_meta_variable(se) ? display_undeclared_meta_variable(se)
    : is_redeclared_variable(se) ? display_redeclared_variable(se)
    : is_failed_check(se) ? display_failed_check(se)
    : is_failed_check_pi(se) ? display_failed_check_pi(se)
    : is_failed_check_object_or_family(se) ? display_failed_check_object_or_family(se)
    : is_failed_check_family_or_kind(se) ? display_failed_check_family_or_kind(se)
    : is_bad_child_sort(se) ? display_bad_child_sort(se)
    : ({ did: "Nothing" })
const display_helper = <SE extends SortError>(did: string, display_func: (se: SE) => object) => (se: SE) => ({
    did,
    subject: ast_to_string(se.subject),
    ...display_func(se)
})
export class UndeclaredConstant extends SortError {}
export const is_undeclared_constant = (u: any): u is UndeclaredConstant => u instanceof UndeclaredConstant
export const display_undeclared_constant = display_helper("UndeclaredConstant", (se) => ({}))
export class UndeclaredVariable extends SortError {}
export const is_undeclared_variable = (u: any): u is UndeclaredVariable => u instanceof UndeclaredVariable
export const display_undeclared_variable = display_helper("UndeclaredVariable", (se) => ({}))
export class UndeclaredMetaVariable extends SortError {}
export const is_undeclared_meta_variable = (u: any): u is UndeclaredMetaVariable => u instanceof UndeclaredMetaVariable
export const display_undeclared_meta_variable = display_helper("UndeclaredMetaVariable", (se) => ({}))
export class RedeclaredVariable extends SortError {}
export const is_redeclared_variable = (r: any): r is RedeclaredVariable => r instanceof RedeclaredVariable
export const display_redeclared_variable = display_helper("RedeclaredVariable", (se) => ({}))
export class FailedCheck extends SortError { constructor(subject: Ast, readonly expected: Sort, readonly actual: Sort) { super(subject) } }
export const is_failed_check = (f: any): f is FailedCheck => f instanceof FailedCheck
export const display_failed_check = display_helper("FailedCheck", (se: FailedCheck) => ({
    expected: display_sort(se.expected),
    actual: display_sort(se.actual)
}))
export class FailedCheckPi extends SortError { constructor(subject: Ast, readonly actual: Sort) { super(subject) } }
export const is_failed_check_pi = (f: any): f is FailedCheckPi => f instanceof FailedCheckPi
export const display_failed_check_pi = display_helper("FailedCheckPi", (se: FailedCheckPi) => ({
    expected: "Π(x: ?).?",
    actual: display_sort(se.actual)
}))
export class FailedCheckObjectOrFamily extends SortError { constructor(subject: Ast, readonly actual: Sort) { super(subject) } }
export const is_failed_check_object_or_family = (f: any): f is FailedCheckObjectOrFamily => f instanceof FailedCheckObjectOrFamily
export const display_failed_check_object_or_family = display_helper("FailedCheckObjectOrFamily", (se: FailedCheckObjectOrFamily) => ({
    expected: "Object | Type",
    actual: display_sort(se.actual)
}))
export class FailedCheckFamilyOrKind extends SortError { constructor(subject: Ast, readonly actual: Sort) { super(subject) } }
export const is_failed_check_family_or_kind = (f: any): f is FailedCheckFamilyOrKind => f instanceof FailedCheckFamilyOrKind
export const display_failed_check_family_or_kind = display_helper("FailedCheckFamilyOrKind", (se: FailedCheckFamilyOrKind) => ({
    expected: "Type | Kind",
    actual: display_sort(se.actual)
}))
export class BadChildSort extends SortError { constructor(subject: Ast, readonly child_error: SortError) { super(subject) } }
export const is_bad_child_sort = (b: any): b is BadChildSort => b instanceof BadChildSort
export const display_bad_child_sort = display_helper("BadChildSort", (se: BadChildSort) => ({
    child_error: display_sort_error(se.child_error),
}))