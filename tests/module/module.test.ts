import { Ast, Constant, MetaVariable, Variable } from "../../src/lambda_pi/ast"
import { mvs_in } from "../../src/lambda_pi/mvs_in"
import { app, clist, con, flapp, func_type, mvlist, nat, ovlist, pi, type_k } from "../../src/lambda_pi/shorthands"
import { is_constant, is_natural_number } from "../../src/lambda_pi/utilities"
import { Ctx } from "../../src/logical_framework/ctx"
import { Env } from "../../src/logical_framework/env"
import { Sig } from "../../src/logical_framework/sig"
import { mk_sig, nn_key, SigKey } from "../../src/logical_framework/sig2"
import { Sort } from "../../src/logical_framework/sort"
import { is_sort_error, SortError, UndeclaredConstant } from "../../src/logical_framework/sort_errors"
import { synthesize } from "../../src/logical_framework/synthesize_type"
import { and } from "../../src/maclogic/maclogic_shorthands"
import { mk_map, RecursiveMap } from "../../src/map/RecursiveMap"
import { AddConflictingSubstitutionEntry, Substitution } from "../../src/unification/first_order"
import { defined, first, is_empty, rest } from "../../src/utilities"

// PROBLEM:
// what if we have this sort of thing?
// N: Type
// 1: Type
// <nat>: N
// Then what is 1's type?
// The simplest solution would be to make this impossible.

const [a, b, c, d] = clist('a', 'b', 'c', 'd')
const [x, y, z, u, v] = ovlist('x', 'y', 'z', 'u', 'v')

class ConstantDeclaration { constructor(readonly identifier: SigKey, readonly sort: Ast) {} }
const decl_constant = (constant: SigKey, sort: Ast): ConstantDeclaration => new ConstantDeclaration(constant, sort)
const is_constant_declaration = (cd: unknown): cd is ConstantDeclaration => cd instanceof ConstantDeclaration

const synthesize_constant_declaration = (module: Module, decl: ConstantDeclaration): Module | IdentifierRedeclaration | BadSortDeclaration => {
    const previous_sort = module.signature.lookup(decl.identifier)
    if (defined(previous_sort))
        return identifier_redeclaration(decl)
    const sort_sort = synthesize(new Env(module.signature, module.type_context, mk_map()), decl.sort)
    if (is_sort_error(sort_sort))
        return bad_sort_declaration(decl, sort_sort)
    return {
        ...module,
        signature: module.signature.add(decl.identifier, decl.sort)
    }
}

describe.only('synthesize_constant_declaration', () => {
    test('given empty sig, valid', () => expect(
        synthesize_constant_declaration(empty_module, decl_constant(a, type_k))
    ).toEqual({
        signature: mk_sig([a, type_k]),
        definitions: mk_map(),
        type_context: mk_map()
    }))
    test('given empty sig, invalid type', () => expect(
        synthesize_constant_declaration(empty_module, decl_constant(a, b))
    ).toEqual(
        bad_sort_declaration(decl_constant(a, b), new UndeclaredConstant(b))
    ))
    test('given non-empty sig, valid, depending on constant and variable', () => expect(
        synthesize_constant_declaration(
            {
                signature: mk_sig([a, type_k], [b, pi(x, a, type_k)]),
                definitions: mk_map(),
                type_context: mk_map(['x', a])
            },
            decl_constant(c, app(b, x))
        )
    ).toEqual({
        signature: mk_sig([a, type_k], [b, pi(x, a, type_k)], [c, app(b, x)]),
        definitions: mk_map(),
        type_context: mk_map(['x', a])
    }))
    test('given non-empty sig, constant redeclaration', () => expect(
        synthesize_constant_declaration(
            {
                signature: mk_sig([a, type_k]),
                definitions: mk_map(),
                type_context: mk_map()
            },
            decl_constant(a, type_k)
        )
    ).toEqual(
        identifier_redeclaration(decl_constant(a, type_k))
    ))
})

// I'm going to have to change how equality works if I want everything to type-check properly and that's lame.
// Don't think about it yet.
class DefinitionDeclaration { constructor(readonly variable: Variable, readonly sort: Ast, readonly definition: Ast) {} }
const decl_definition = (variable: Variable, sort: Ast, def: Ast): DefinitionDeclaration => new DefinitionDeclaration(variable, sort, def)
const is_definition_declaration = (d: unknown): d is DefinitionDeclaration => d instanceof DefinitionDeclaration

const synthesize_definition_declaration = (module: Module, decl: DefinitionDeclaration): Module | IdentifierRedeclaration | DefinitionDoesNotSynthesize | BadSortDeclaration => {
    throw new Error('unimplemented')
}

// class NaturalNumberDeclaration { constructor(readonly nn_sort: Ast) {} }
// const decl_natural_numbers = (nn_sort: Ast): NaturalNumberDeclaration => new NaturalNumberDeclaration(nn_sort)
// const is_natural_numbers_declaration = (n: NaturalNumberDeclaration): n is NaturalNumberDeclaration => n instanceof NaturalNumberDeclaration

// // a constant redeclaration can occur if we attempt to declare the natural numbers twice.
// const synthesize_natural_number_declaration = (module: Module, decl: NaturalNumberDeclaration): Module | IdentifierRedeclaration | BadSortDeclaration => {
//     const previous_sort = module.signature.lookup('N')
//     if (defined(previous_sort))
//         return identifier_redeclaration()
//     const sort_sort = synthesize(new Env(module.signature, module.type_context, mk_map()), decl.sort)
//     if (is_sort_error(sort_sort))
//         return bad_sort_declaration(decl, sort_sort)
//     return {
//         ...module,
//         signature: module.signature.add(decl.constant, decl.sort)
//     }
// }

// describe('synthesize_natural_number_declaration', () => {
//     test('given empty sig, valid', () => expect(
//         synthesize_natural_number_declaration(empty_module, decl_natural_numbers(type_k))
//     ).toEqual({
//         signature: mk_sig(['N', type_k]),
//         definitions: mk_map(),
//         type_context: mk_map()
//     }))
//     test('given empty sig, invalid type', () => expect(
//         synthesize_natural_number_declaration(empty_module, decl_natural_numbers(b))
//     ).toEqual(
//         bad_sort_declaration(decl_natural_numbers(b), new UndeclaredConstant(b))
//     ))
//     test('given non-empty sig, valid, depending on constant and variable', () => expect(
//         synthesize_natural_number_declaration(
//             {
//                 signature: mk_sig([a, type_k], [b, pi(x, a, type_k)]),
//                 definitions: mk_map(),
//                 type_context: mk_map(['x', a])
//             },
//             decl_natural_numbers(app(b, x))
//         )
//     ).toEqual({
//         signature: mk_sig([a, type_k], [b, pi(x, a, type_k)], ['N', app(b, x)]),
//         definitions: mk_map(),
//         type_context: mk_map(['x', a])
//     }))
//     test('given non-empty sig, constant redeclaration', () => expect(
//         synthesize_natural_number_declaration(
//             {
//                 signature: mk_sig([a, type_k]),
//                 definitions: mk_map(),
//                 type_context: mk_map()
//             },
//             decl_natural_numbers(type_k)
//         )
//     ).toEqual(
//         identifier_redeclaration(decl_constant(a, type_k))
//     ))
// })

type Declaration =
    | ConstantDeclaration
    // | NaturalNumberDeclaration
    | DefinitionDeclaration

class IdentifierRedeclaration { constructor(readonly decl: ConstantDeclaration) {} }
const identifier_redeclaration = (decl: ConstantDeclaration): IdentifierRedeclaration => new IdentifierRedeclaration(decl)
const is_identifier_redeclaration = (r: unknown): r is IdentifierRedeclaration => r instanceof IdentifierRedeclaration

class BadSortDeclaration { constructor(readonly decl: Declaration, readonly sort_error: SortError) {} }
const bad_sort_declaration = (decl: Declaration, sort_error: SortError): BadSortDeclaration => new BadSortDeclaration(decl, sort_error)
const is_bad_sort_declaration = (b: unknown): b is BadSortDeclaration => b instanceof BadSortDeclaration

class VariableRedeclaration { constructor(readonly decl: DefinitionDeclaration) {} }
const variable_redeclaration = (decl: DefinitionDeclaration): VariableRedeclaration => new VariableRedeclaration(decl)
const is_variable_redeclaration = (d: unknown): d is VariableRedeclaration => d instanceof VariableRedeclaration

class DefinitionDoesNotSynthesize { constructor(readonly decl: DefinitionDeclaration, readonly sort_error: SortError) {} }
const definition_does_not_synthesize = (decl: DefinitionDeclaration, sort_error: SortError): DefinitionDoesNotSynthesize => new DefinitionDoesNotSynthesize(decl, sort_error)
const is_definition_does_not_synthesize = (d: unknown): d is DefinitionDoesNotSynthesize => d instanceof DefinitionDoesNotSynthesize

type BadDeclaration =
    | IdentifierRedeclaration
    | VariableRedeclaration
    | DefinitionDoesNotSynthesize
    | BadSortDeclaration

const synthesize_declaration = (module: Module, declaration: Declaration): Module | BadDeclaration => {
    throw new Error('unimplemented')
}

class EmptyModuleSpec {}
const empty_module_spec = new EmptyModuleSpec
const is_empty_module_spec = (s: unknown): s is EmptyModuleSpec => s instanceof EmptyModuleSpec
class NonEmptyModuleSpec { constructor(readonly declaration: Declaration, readonly rest: ModuleSpec) {} }
const non_empty_module_spec = (decl: Declaration, rest: ModuleSpec): NonEmptyModuleSpec => new NonEmptyModuleSpec(decl, rest)
const is_non_empty_module_spec = (s: unknown): s is NonEmptyModuleSpec => s instanceof NonEmptyModuleSpec
type ModuleSpec = EmptyModuleSpec | NonEmptyModuleSpec

const make_module_spec = (decls: Declaration[]): ModuleSpec =>
    is_empty(decls) ? empty_module_spec
    : non_empty_module_spec(first(decls), make_module_spec(rest(decls)))

const [eq_2_2] = ovlist('eq_2_2')
const [N, O, S, plus, eq, refl, symm, tran, O_eq, S_eq, S_def, plus_def] = clist('N', 'O', 'S', 'plus', 'eq', 'refl', 'symm', 'tran', 'O_eq', 'S_eq', 'S_def', 'plus_def')
const S_f = (x: Ast): Ast => flapp(S, O)
const eq_f = (x: Ast, y: Ast): Ast => flapp(eq, x, y)
const plus_f = (x: Ast, y: Ast): Ast => flapp(plus, x, y)
const refl_f = (x: Ast): Ast => flapp(refl, x)

const single_constant_module = make_module_spec([
    decl_constant(con('cool'), type_k)
])

const invalid_single_constant_module = make_module_spec([
    decl_constant(con('cool'), N)
])

const simple_nat_module = make_module_spec([
    decl_constant(N, type_k),
    decl_constant(nn_key, N)
])

const invalid_simple_nat_module_bad_first = make_module_spec([
    decl_constant(N, con('cool')),
    decl_constant(nn_key, N)
])

const invalid_simple_nat_module_bad_second = make_module_spec([
    decl_constant(N, type_k),
    decl_constant(nn_key, con('cool'))
])

const nat_module = make_module_spec([
    decl_constant(N, type_k),
    decl_constant(O, N),
    decl_constant(S, func_type([N], N)),
    decl_constant(nn_key, N),
    decl_constant(plus, func_type([N, N], N)),

    decl_constant(eq, func_type([N, N], type_k)),
    decl_constant(refl, pi(x, N, eq_f(x, x))),
    decl_constant(symm, pi(x, N, pi(y, N, pi(z, eq_f(x, y), eq_f(y, x))))),
    decl_constant(tran, pi(x, N, pi(y, N, pi(z, N, pi(u, eq_f(x, y), pi(v, eq_f(y, z), eq_f(x, z))))))),
    decl_constant(O_eq, eq_f(O, O)),
    decl_constant(S_eq, pi(x, N, pi(y, N, pi(z, eq_f(x, y), eq_f(S_f(x), S_f(y)))))),
    decl_constant(S_def, pi(x, N, eq_f(S_f(x), plus_f(x, nat(1))))),
    decl_constant(plus_def, pi(x, N, pi(y, N, eq_f(plus_f(x, S_f(y)), S_f(plus_f(x, y)))))),

    decl_definition(eq_2_2, eq_f(nat(2), nat(2)), refl_f(nat(2)))
])

const empty_module: Module = { signature: mk_sig(), definitions: mk_map(), type_context: mk_map() }

interface Module {
    signature: Sig
    // definitions won't have any computational capacity for now -- they'll simply check whatever is on the right hand side and convert them to beta normal form.
    definitions: RecursiveMap<Ast>
    type_context: Ctx
}

class BadDeclarationInModule { constructor(readonly bad_declaration: BadDeclaration, readonly module_so_far: Module, readonly rest: ModuleSpec) {} }
const bad_declaration_in_module = (bd: BadDeclaration, module_so_far: Module, rest: ModuleSpec): BadDeclarationInModule => new BadDeclarationInModule(bd, module_so_far, rest)
const is_bad_declaration_in_module = (d: unknown): d is BadDeclarationInModule => d instanceof BadDeclarationInModule
class BadChildModule { constructor(readonly declaration: Declaration, readonly child_error: ModuleSynthesisError) {} }
const bad_child_module = (declaration: Declaration, child_error: ModuleSynthesisError): BadChildModule => new BadChildModule(declaration, child_error)
const is_bad_child_module = (b: unknown): b is BadChildModule => b instanceof BadChildModule
type ModuleSynthesisError =
    | BadDeclarationInModule
    | BadChildModule

const synthesize_module = (spec: ModuleSpec): Module | ModuleSynthesisError => {
    throw new Error('unimplemented')
}

describe('synthesize module', () => {
    test('empty', () => expect(synthesize_module(empty_module_spec)).toEqual(empty_module))
    test('single constant module', () => expect(
        synthesize_module(single_constant_module)
    ).toEqual({
        signature: mk_sig([con('cool'), type_k]),
        definitions: mk_map(),
        type_context: mk_map()
    }))
    test('invalid_single_constant_module', () => expect(
        synthesize_module(invalid_single_constant_module)
    ).toEqual(
        bad_declaration_in_module(
            bad_sort_declaration(decl_constant(con('cool'), N), new UndeclaredConstant(N)),
            empty_module,
            empty_module_spec
        )
    ))
    test('simple_nat_module', () => expect(
        synthesize_module(simple_nat_module)
    ).toEqual({
        signature: mk_sig([N, type_k], ['N', N]),
        definitions: mk_map(),
        type_context: mk_map()
    }))
    test('invalid_simple_nat_module_bad_first', () => expect(
        synthesize_module(invalid_simple_nat_module_bad_first)
    ).toEqual(
        bad_declaration_in_module(
            bad_sort_declaration(decl_constant(N, con('cool')), new UndeclaredConstant(con('cool'))),
            empty_module,
            make_module_spec([
                decl_constant(nn_key, N)
            ])
        )
    ))
    test('invalid_simple_nat_module_bad_second', () => expect(
        synthesize_module(invalid_simple_nat_module_bad_second)
    ).toEqual(
        bad_child_module(
            decl_constant(N, type_k),
            bad_declaration_in_module(
                bad_sort_declaration(decl_constant(nn_key, N), new UndeclaredConstant(con('cool'))),
                {
                    signature: mk_sig([N, type_k], ['N', N]),
                    definitions: mk_map(),
                    type_context: mk_map()
                },
                empty_module_spec
            )
        )
    ))
})

