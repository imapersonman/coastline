import { Ast, Variable } from "../lambda_pi/ast"
import { con, type_k } from "../lambda_pi/shorthands"
import { ast_to_string, is_constant, is_natural_number, is_variable } from "../lambda_pi/utilities"
import { Ctx, display_ctx } from "../logical_framework/ctx"
import { Env } from "../logical_framework/env"
import { display_sig, Sig } from "../logical_framework/sig"
import { display_sig_key, mk_sig, nn_key, SigKey } from "../logical_framework/sig2"
import { display_sort, Sort } from "../logical_framework/sort"
import { display_sort_error, is_sort_error, SortError } from "../logical_framework/sort_errors"
import { check_and_report_with_defs, synthesize_with_defs } from "../logical_framework/synthesize_type"
import { display_recursive_map, mk_map, RecursiveMap } from "../map/RecursiveMap"
import { defined, first, is_empty, rest } from "../utilities"

export const empty_module: Module = { signature: mk_sig(), definitions: mk_map(), type_context: mk_map() }
const env_from_mod = (module: Module): Env => new Env(module.signature, module.type_context, mk_map())

export interface Module {
    signature: Sig
    // definitions won't have any computational capacity for now -- they'll simply check whatever is on the right hand side and convert them to beta normal form.
    definitions: RecursiveMap<Ast>
    type_context: Ctx
    reports?: ModuleReport[]
}

export const display_module = (module: Module) => ({
    signature: display_sig(module.signature),
    definitions: display_recursive_map(module.definitions, ast_to_string),
    type_context: display_ctx(module.type_context),
    reports: defined(module.reports) ? module.reports.map(display_module_report) : []
})

export class BadDeclarationInModule { constructor(readonly bad_declaration: BadDeclaration, readonly module_so_far: Module, readonly rest: ModuleSpec) {} }
export const bad_declaration_in_module = (bd: BadDeclaration, module_so_far: Module, rest: ModuleSpec): BadDeclarationInModule => new BadDeclarationInModule(bd, module_so_far, rest)
export const is_bad_declaration_in_module = (d: unknown): d is BadDeclarationInModule => d instanceof BadDeclarationInModule
export const display_bad_declaration_in_module = (e: BadDeclarationInModule) => ({
    module_so_far: display_module(e.module_so_far),
    bad_declaration: display_bad_declaration(e.bad_declaration),
    rest: display_module_spec(e.rest)
})

export class BadChildModule { constructor(readonly declaration: Declaration, readonly child_error: ModuleSynthesisError) {} }
export const bad_child_module = (declaration: Declaration, child_error: ModuleSynthesisError): BadChildModule => new BadChildModule(declaration, child_error)
export const is_bad_child_module = (b: unknown): b is BadChildModule => b instanceof BadChildModule
export const display_bad_child_module = (e: BadChildModule) => ({
    declaration: display_declaration(e.declaration),
    child_error: display_module_synthesis_error(e.child_error)
})

export type ModuleSynthesisError =
    | BadDeclarationInModule
    | BadChildModule

export const is_module_synthesis_error = (m: unknown): m is ModuleSynthesisError =>
    is_bad_declaration_in_module(m)
    || is_bad_child_module(m)

export const display_module_synthesis_error = (e: ModuleSynthesisError) => {
    if (is_bad_declaration_in_module(e))
        return display_bad_declaration_in_module(e)
    if (is_bad_child_module(e))
        return display_bad_child_module(e)
    return 'Unkown ModuleSynthesisError'
}

const add_report = (module: Module, report: ModuleReport): Module => ({
    ...module,
    reports: defined(module.reports) ? [...module.reports, report] : [report]
})

export const synthesize_report_line = (module: Module, line: ReportLine): Module => {
    const report = check_report_line(module, line)
    if (is_okay_report(report))
        return module
    return add_report(module, report)
}

export const synthesize_module = (module: Module, spec: ModuleSpec): Module | ModuleSynthesisError => {
    if (is_non_empty_module_spec(spec)) {
        if (is_declaration(spec.line)) {
            const decl_module = synthesize_declaration(module, spec.line)
            if (is_bad_declaration(decl_module))
                return bad_declaration_in_module(decl_module, module, spec.rest)
            const rest_module = synthesize_module(decl_module, spec.rest)
            if (is_module_synthesis_error(rest_module))
                return bad_child_module(spec.line, rest_module)
            return rest_module
        } else if (is_report_line(spec.line)) {
            return synthesize_module(synthesize_report_line(module, spec.line), spec.rest)
        }
    }
    // spec is of type never if the clauses aren't in this order so here we are.
    if (is_empty_module_spec(spec))
        return module
    throw new Error(`Unrecognized Module Spec: ${JSON.stringify(spec)}`)
}

export type Declaration =
    | ConstantDeclaration
    | DefinitionDeclaration

export const display_declaration = (d: Declaration) => {
    if (is_constant_declaration(d))
        return display_constant_declaration(d)
    if (is_definition_declaration(d))
        return display_definition_declaration(d)
    return 'Unknown Declaration'
}

export const is_declaration = (d: unknown): d is Declaration => is_constant_declaration(d) || is_definition_declaration(d)

export class InvalidIdentifier { constructor(readonly decl: Declaration) {} }
export const invalid_identifier = (decl: Declaration): InvalidIdentifier => new InvalidIdentifier(decl)
export const is_invalid_identifier = (i: unknown): i is InvalidIdentifier => i instanceof InvalidIdentifier
export const display_invalid_identifier = (i: InvalidIdentifier) => ({
    type: 'InvalidIdentifier',
    decl: display_declaration(i.decl)
})

export class IdentifierRedeclaration { constructor(readonly decl: Declaration) {} }
export const identifier_redeclaration = (decl: Declaration): IdentifierRedeclaration => new IdentifierRedeclaration(decl)
export const is_identifier_redeclaration = (r: unknown): r is IdentifierRedeclaration => r instanceof IdentifierRedeclaration
export const display_identifier_redeclaration = (i: IdentifierRedeclaration) => ({
    type: 'IdentifierRedeclaration',
    decl: display_declaration(i.decl)
})

export class BadSortDeclaration { constructor(readonly decl: Declaration, readonly sort_error: SortError) {} }
export const bad_sort_declaration = (decl: Declaration, sort_error: SortError): BadSortDeclaration => new BadSortDeclaration(decl, sort_error)
export const is_bad_sort_declaration = (b: unknown): b is BadSortDeclaration => b instanceof BadSortDeclaration
export const display_bad_sort_declaration = (b: BadSortDeclaration) => ({
    type: 'BadSortDeclaration',
    decl: display_declaration(b.decl),
    sort_error: display_sort_error(b.sort_error)
})

export class FailedDefinitionCheck { constructor(readonly decl: DefinitionDeclaration, readonly sort_error: SortError) {} }
export const failed_definition_check = (decl: DefinitionDeclaration, sort_error: SortError): FailedDefinitionCheck => new FailedDefinitionCheck(decl, sort_error)
export const is_failed_definition_check = (d: unknown): d is FailedDefinitionCheck => d instanceof FailedDefinitionCheck
export const display_failed_definition_check = (c: FailedDefinitionCheck) => ({
    type: 'FailedDefinitionCheck',
    decl: display_declaration(c.decl),
    sort_error: display_sort_error(c.sort_error)
})

export type BadDeclaration =
    | InvalidIdentifier
    | IdentifierRedeclaration
    | FailedDefinitionCheck
    | BadSortDeclaration

export const display_bad_declaration = (b: BadDeclaration) => {
    if (is_invalid_identifier(b))
        return display_invalid_identifier(b)
    if (is_identifier_redeclaration(b))
        return display_identifier_redeclaration(b)
    if (is_failed_definition_check(b))
        return display_failed_definition_check(b)
    if (is_bad_sort_declaration(b))
        return display_bad_sort_declaration(b)
    return 'Unknown BadDeclaration'
}

export const is_bad_declaration = (b: unknown): b is BadDeclaration =>
    is_invalid_identifier(b)
    || is_identifier_redeclaration(b)
    || is_failed_definition_check(b)
    || is_failed_definition_check(b)
    || is_bad_sort_declaration(b)

export const synthesize_declaration = (module: Module, declaration: Declaration): Module | BadDeclaration => {
    if (is_constant_declaration(declaration))
        return synthesize_constant_declaration(module, declaration)
    if (is_definition_declaration(declaration))
        return synthesize_definition_declaration(module, declaration)
    throw new Error(`Unrecognized declaration: ${JSON.stringify(declaration)}`)
}

export type ModuleSpecLine = Declaration | ReportLine
export const display_module_spec_line = (l: ModuleSpecLine) => {
    if (is_declaration(l))
        return display_declaration(l)
    if (is_report_line(l))
        return display_report_line(l)
}

export class EmptyModuleSpec {}
export const empty_module_spec = new EmptyModuleSpec
export const is_empty_module_spec = (s: unknown): s is EmptyModuleSpec => s instanceof EmptyModuleSpec
export class NonEmptyModuleSpec { constructor(readonly line: ModuleSpecLine, readonly rest: ModuleSpec) {} }
export const non_empty_module_spec = (line: ModuleSpecLine, rest: ModuleSpec): NonEmptyModuleSpec => new NonEmptyModuleSpec(line, rest)
export const is_non_empty_module_spec = (s: unknown): s is NonEmptyModuleSpec => s instanceof NonEmptyModuleSpec
export type ModuleSpec =
    | NonEmptyModuleSpec
    | EmptyModuleSpec
export const display_module_spec = (s: ModuleSpec) => {
    if (is_non_empty_module_spec(s))
        return [display_module_spec_line(s.line), ...display_module_spec(s.rest)]
    if (is_empty_module_spec(s))
        return []
    return 'Unknown ModuleSpec'
}

export const make_module_spec = (lines: ModuleSpecLine[]): ModuleSpec =>
    is_empty(lines) ? empty_module_spec
    : non_empty_module_spec(first(lines), make_module_spec(rest(lines)))

// I'm going to have to change how equality works if I want everything to type-check properly and that's lame.
// Don't think about it yet.
export class DefinitionDeclaration { constructor(readonly variable: Variable, readonly sort: Ast, readonly definition: Ast) {} }
export const decl_definition = (variable: Variable, sort: Ast, def: Ast): DefinitionDeclaration => new DefinitionDeclaration(variable, sort, def)
export const is_definition_declaration = (d: unknown): d is DefinitionDeclaration => d instanceof DefinitionDeclaration

export const display_definition_declaration = (d: DefinitionDeclaration) => ({
    variable: ast_to_string(d.variable),
    sort: ast_to_string(d.sort),
    definition: ast_to_string(d.definition)
})

/*
RETHINK THIS FUNCTION -- should be something related to simultaneous substitution.
The module's invariant should be that the intersection between the domain of the substitution and the
free variables of all the entries unioned together is the empty set (the domain and the unioned free variables are
disjoint).

This can be accomplished by applying the definition as a simultaneous substitution to the definition of the
relevant variable before placing it in the substitution.
*/
export const synthesize_definition_declaration = (module: Module, decl: DefinitionDeclaration): Module | IdentifierRedeclaration | FailedDefinitionCheck | BadSortDeclaration => {
    if (identifier_was_previously_declared(module, decl.variable))
        return identifier_redeclaration(decl)
    const env = env_from_mod(module) 
    const checked_sort = check_and_report_with_defs(module.definitions, env, decl.sort, type_k)
    if (is_sort_error(checked_sort))
        return bad_sort_declaration(decl, checked_sort)
    const checked_definition = check_and_report_with_defs(module.definitions, env, decl.definition, decl.sort)
    if (is_sort_error(checked_definition))
        return failed_definition_check(decl, checked_definition)
    return {
        ...module,
        definitions: module.definitions.add(decl.variable.id, decl.definition),
        type_context: module.type_context.add(decl.variable.id, decl.sort)
    }
}

export class ConstantDeclaration { constructor(readonly identifier: SigKey, readonly sort: Ast) {} }
export const decl_constant = (constant: SigKey, sort: Ast): ConstantDeclaration => new ConstantDeclaration(constant, sort)
export const is_constant_declaration = (cd: unknown): cd is ConstantDeclaration => cd instanceof ConstantDeclaration
export const display_constant_declaration = (c: ConstantDeclaration) => ({
    type: 'ConstantDeclaration',
    identifier: display_sig_key(c.identifier),
    sort: ast_to_string(c.sort)
})

export const identifier_was_previously_declared = (module: Module, identifier: SigKey | Variable): boolean => {
    // this function is way too complicated
    return (identifier === nn_key && module.signature.contains(identifier))
        || (is_variable(identifier) && module.signature.contains(con(identifier.id)))
        || (is_constant(identifier) && module.signature.contains(identifier))
        || ((is_constant(identifier) || is_variable(identifier)) && module.type_context.contains(identifier.id))
}

export const synthesize_constant_declaration = (module: Module, decl: ConstantDeclaration): Module | InvalidIdentifier | IdentifierRedeclaration | BadSortDeclaration => {
    if (is_natural_number(decl.identifier))
        return invalid_identifier(decl)
    if (identifier_was_previously_declared(module, decl.identifier))
        return identifier_redeclaration(decl)
    const sort_sort = synthesize_with_defs(module.definitions, env_from_mod(module), decl.sort)
    if (is_sort_error(sort_sort))
        return bad_sort_declaration(decl, sort_sort)
    return {
        ...module,
        signature: module.signature.add(decl.identifier, decl.sort)
    }
}

// doesn't put anything in the module -- just gives an error and moves on
export class TypeCheckLine { constructor(readonly ast: Ast, readonly sort: Sort) {} }
export const report_check_type = (ast: Ast, sort: Sort): TypeCheckLine => new TypeCheckLine(ast, sort)
export const is_type_check_line = (t: unknown): t is TypeCheckLine => t instanceof TypeCheckLine
export const display_type_check_line = (l: TypeCheckLine) => ({
    type: 'TypeCheckLine',
    ast: ast_to_string(l.ast),
    sort: display_sort(l.sort)
})

export class TypeSynthLine { constructor(readonly ast: Ast) {} }
export const report_synth_type = (ast: Ast): TypeSynthLine => new TypeSynthLine(ast)
export const is_type_synth_line = (t: unknown): t is TypeSynthLine => t instanceof TypeSynthLine
export const display_type_synth_line = (l: TypeSynthLine) => ({
    type: 'TypeSynthLine',
    ast: ast_to_string(l.ast)
})

export type ReportLine = TypeCheckLine | TypeSynthLine
export const is_report_line = (s: unknown): s is ReportLine => is_type_check_line(s) || is_type_synth_line(s)
export const display_report_line = (l: ReportLine) => {
    if (is_type_check_line(l))
        return display_type_check_line(l)
    if (is_type_synth_line(l))
        return display_type_synth_line(l)
    return 'Unkown ReportLine'
}

export class SortErrorReport { constructor(readonly line: ReportLine, readonly sort_error: SortError) {} }
export const sort_error_report = (line: ReportLine, sort_error: SortError) => new SortErrorReport(line, sort_error)
export const is_sort_error_report = (s: unknown): s is SortErrorReport => s instanceof SortErrorReport
export const display_sort_error_report = (r: SortErrorReport) => ({
    line: display_report_line(r.line),
    sort_error: display_sort_error(r.sort_error)
})

export class OkayReport {}
export const okay_report = new OkayReport
export const is_okay_report = (m: unknown): m is OkayReport => m instanceof OkayReport

export class SortSynthReport { constructor(readonly ast: Ast, readonly synthed_sort: Sort) {} }
export const sort_synth_report = (ast: Ast, synthed_sort: Sort): SortSynthReport => new SortSynthReport(ast, synthed_sort)
export const is_sort_synth_report = (s: unknown): s is SortSynthReport => s instanceof SortSynthReport
export const display_sort_synth_report = (r: SortSynthReport) => ({
    ast: ast_to_string(r.ast),
    synthed_sort: display_sort(r.synthed_sort)
})

export type ModuleReport = SortErrorReport | OkayReport
export const is_module_report = (s: unknown): s is ModuleReport => is_sort_error_report(s) || is_okay_report(s) || is_sort_synth_report(s)

export const display_module_report = (r: ModuleReport) => {
    if (is_sort_error_report(r))
        return display_sort_error_report(r)
    if (is_okay_report(r))
        return 'Okay'
    if (is_sort_synth_report(r))
        return display_sort_synth_report(r)
    return 'Unknown ModuleReport'
}

export const check_type_check_line = (module: Module, check_line: TypeCheckLine): ModuleReport => {
    const checked = check_and_report_with_defs(
        module.definitions,
        env_from_mod(module),
        check_line.ast,
        check_line.sort)
    if (is_sort_error(checked))
        return sort_error_report(check_line, checked)
    return okay_report
}

export const check_type_synth_line = (module: Module, synth_line: TypeSynthLine): ModuleReport => {
    const synthed = synthesize_with_defs(module.definitions, env_from_mod(module), synth_line.ast)
    if (is_sort_error(synthed))
        return sort_error_report(synth_line, synthed)
    return sort_synth_report(synth_line.ast, synthed)
}

export const check_report_line = (module: Module, status_line: ReportLine): ModuleReport => {
    if (is_type_check_line(status_line))
        return check_type_check_line(module, status_line)
    if (is_type_synth_line(status_line))
        return check_type_synth_line(module, status_line)
    return okay_report
}

export const check_module_spec_status = (module: Module, spec: ModuleSpec): void => {
    const synthed_module = synthesize_module(module, spec)
    if (is_module_synthesis_error(synthed_module))
        throw new Error(`Given Spec resulted in an error:\n${JSON.stringify(display_module_synthesis_error(synthed_module))}`);
    (synthed_module.reports ?? []).forEach((report) => console.log(display_module_report(report)))
}