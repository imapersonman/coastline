import { Ast, Variable } from "../lambda_pi/ast"
import { con, type_k } from "../lambda_pi/shorthands"
import { is_constant, is_natural_number, is_variable } from "../lambda_pi/utilities"
import { Ctx } from "../logical_framework/ctx"
import { Env } from "../logical_framework/env"
import { Sig } from "../logical_framework/sig"
import { mk_sig, nn_key, SigKey } from "../logical_framework/sig2"
import { is_sort_error, SortError } from "../logical_framework/sort_errors"
import { check_and_report, synthesize } from "../logical_framework/synthesize_type"
import { mk_map, RecursiveMap } from "../map/RecursiveMap"
import { first, is_empty, rest } from "../utilities"

export const empty_module: Module = { signature: mk_sig(), definitions: mk_map(), type_context: mk_map() }

export interface Module {
    signature: Sig
    // definitions won't have any computational capacity for now -- they'll simply check whatever is on the right hand side and convert them to beta normal form.
    definitions: RecursiveMap<Ast>
    type_context: Ctx
}

export class BadDeclarationInModule { constructor(readonly bad_declaration: BadDeclaration, readonly module_so_far: Module, readonly rest: ModuleSpec) {} }
export const bad_declaration_in_module = (bd: BadDeclaration, module_so_far: Module, rest: ModuleSpec): BadDeclarationInModule => new BadDeclarationInModule(bd, module_so_far, rest)
export const is_bad_declaration_in_module = (d: unknown): d is BadDeclarationInModule => d instanceof BadDeclarationInModule

export class BadChildModule { constructor(readonly declaration: Declaration, readonly child_error: ModuleSynthesisError) {} }
export const bad_child_module = (declaration: Declaration, child_error: ModuleSynthesisError): BadChildModule => new BadChildModule(declaration, child_error)
export const is_bad_child_module = (b: unknown): b is BadChildModule => b instanceof BadChildModule

export type ModuleSynthesisError =
    | BadDeclarationInModule
    | BadChildModule

export const is_module_synthesis_error = (m: unknown): m is ModuleSynthesisError =>
    is_bad_declaration_in_module(m)
    || is_bad_child_module(m)

export const synthesize_module = (module: Module, spec: ModuleSpec): Module | ModuleSynthesisError => {
    if (is_non_empty_module_spec(spec)) {
        const decl_module = synthesize_declaration(module, spec.declaration)
        if (is_bad_declaration(decl_module))
            return bad_declaration_in_module(decl_module, module, spec.rest)
        const rest_module = synthesize_module(decl_module, spec.rest)
        if (is_module_synthesis_error(rest_module))
            return bad_child_module(spec.declaration, rest_module)
        return rest_module
    }
    // spec is of type never if the clauses aren't in this order so here we are.
    if (is_empty_module_spec(spec))
        return module
    throw new Error(`Unrecognized Module Spec: ${JSON.stringify(spec)}`)
}

export type Declaration =
    | ConstantDeclaration
    | DefinitionDeclaration

export class InvalidIdentifier { constructor(readonly decl: Declaration) {} }
export const invalid_identifier = (decl: Declaration): InvalidIdentifier => new InvalidIdentifier(decl)
export const is_invalid_identifier = (i: unknown): i is InvalidIdentifier => i instanceof InvalidIdentifier

export class IdentifierRedeclaration { constructor(readonly decl: Declaration) {} }
export const identifier_redeclaration = (decl: Declaration): IdentifierRedeclaration => new IdentifierRedeclaration(decl)
export const is_identifier_redeclaration = (r: unknown): r is IdentifierRedeclaration => r instanceof IdentifierRedeclaration

export class BadSortDeclaration { constructor(readonly decl: Declaration, readonly sort_error: SortError) {} }
export const bad_sort_declaration = (decl: Declaration, sort_error: SortError): BadSortDeclaration => new BadSortDeclaration(decl, sort_error)
export const is_bad_sort_declaration = (b: unknown): b is BadSortDeclaration => b instanceof BadSortDeclaration

export class FailedDefinitionCheck { constructor(readonly decl: DefinitionDeclaration, readonly sort_error: SortError) {} }
export const failed_definition_check = (decl: DefinitionDeclaration, sort_error: SortError): FailedDefinitionCheck => new FailedDefinitionCheck(decl, sort_error)
export const is_failed_definition_check = (d: unknown): d is FailedDefinitionCheck => d instanceof FailedDefinitionCheck

export type BadDeclaration =
    | InvalidIdentifier
    | IdentifierRedeclaration
    | FailedDefinitionCheck
    | BadSortDeclaration

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

export class EmptyModuleSpec {}
export const empty_module_spec = new EmptyModuleSpec
export const is_empty_module_spec = (s: unknown): s is EmptyModuleSpec => s instanceof EmptyModuleSpec
export class NonEmptyModuleSpec { constructor(readonly declaration: Declaration, readonly rest: ModuleSpec) {} }
export const non_empty_module_spec = (decl: Declaration, rest: ModuleSpec): NonEmptyModuleSpec => new NonEmptyModuleSpec(decl, rest)
export const is_non_empty_module_spec = (s: unknown): s is NonEmptyModuleSpec => s instanceof NonEmptyModuleSpec
export type ModuleSpec =
    | NonEmptyModuleSpec
    | EmptyModuleSpec

export const make_module_spec = (decls: Declaration[]): ModuleSpec =>
    is_empty(decls) ? empty_module_spec
    : non_empty_module_spec(first(decls), make_module_spec(rest(decls)))


// I'm going to have to change how equality works if I want everything to type-check properly and that's lame.
// Don't think about it yet.
export class DefinitionDeclaration { constructor(readonly variable: Variable, readonly sort: Ast, readonly definition: Ast) {} }
export const decl_definition = (variable: Variable, sort: Ast, def: Ast): DefinitionDeclaration => new DefinitionDeclaration(variable, sort, def)
export const is_definition_declaration = (d: unknown): d is DefinitionDeclaration => d instanceof DefinitionDeclaration

export const synthesize_definition_declaration = (module: Module, decl: DefinitionDeclaration): Module | IdentifierRedeclaration | FailedDefinitionCheck | BadSortDeclaration => {
    if (identifier_was_previously_declared(module, decl.variable))
        return identifier_redeclaration(decl)
    const env = new Env(module.signature, module.type_context, mk_map())
    const checked_sort = check_and_report(env, decl.sort, type_k)
    if (is_sort_error(checked_sort))
        return bad_sort_declaration(decl, checked_sort)
    const checked_definition = check_and_report(env, decl.definition, decl.sort)
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
    const sort_sort = synthesize(new Env(module.signature, module.type_context, mk_map()), decl.sort)
    if (is_sort_error(sort_sort))
        return bad_sort_declaration(decl, sort_sort)
    return {
        ...module,
        signature: module.signature.add(decl.identifier, decl.sort)
    }
}

