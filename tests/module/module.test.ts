import { Ast } from "../../src/lambda_pi/ast"
import { app, clist, con, flapp, func_type, nat, ov, ovlist, pi, type_k } from "../../src/lambda_pi/shorthands"
import { mk_sig, nn_key } from "../../src/logical_framework/sig2"
import { kind_s } from "../../src/logical_framework/sort"
import { FailedCheck, UndeclaredConstant } from "../../src/logical_framework/sort_errors"
import { mk_map } from "../../src/map/RecursiveMap"
import { bad_child_module, bad_declaration_in_module, bad_sort_declaration, decl_constant, decl_definition, empty_module, empty_module_spec, identifier_redeclaration, invalid_identifier, make_module_spec, synthesize_constant_declaration, synthesize_definition_declaration, synthesize_module } from "../../src/module/module"

// PROBLEM (solved):
// what if we have this sort of thing?
// N: Type
// 1: Type
// <nat>: N
// Then what is 1's type?
// The simplest solution would be to make it impossible to declare integers directly, so it would be _1: N (or something) instead of 1: N.

// Variables can't have the same id as previously declared Constants, and Constants can't have the same id as previously declared Variables.

const [a, b, c, d] = clist('a', 'b', 'c', 'd')
const [x, y, z, u, v] = ovlist('x', 'y', 'z', 'u', 'v')

describe('synthesize_constant_declaration', () => {
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
    test('given non-empty sig, valid, depending on constant and variable, but with the natural number SigKey', () => expect(
        synthesize_constant_declaration(
            {
                signature: mk_sig([a, type_k], [b, pi(x, a, type_k)]),
                definitions: mk_map(),
                type_context: mk_map(['x', a])
            },
            decl_constant(nn_key, app(b, x))
        )
    ).toEqual({
        signature: mk_sig([a, type_k], [b, pi(x, a, type_k)], [nn_key, app(b, x)]),
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
    test('given non-empty ctx, identifier redeclaration because of clash with variable', () => expect(
        synthesize_constant_declaration(
            {
                signature: mk_sig([a, type_k]),
                definitions: mk_map(),
                type_context: mk_map(['b', a])
            },
            decl_constant(b, type_k)
        )
    ).toEqual(
        identifier_redeclaration(decl_constant(b, type_k))
    ))
    test('trying to declare a natural number directly is invalid', () => expect(
        synthesize_constant_declaration(
            {
                signature: mk_sig([a, type_k], [b, pi(x, a, type_k)]),
                definitions: mk_map(),
                type_context: mk_map(['x', a])
            },
            decl_constant(nat(1), type_k)
        )
    ).toEqual(
        invalid_identifier(decl_constant(nat(1), type_k))
    ))
    test('trying to declare the natural numbers twice is invalid', () => expect(
        synthesize_constant_declaration(
            {
                signature: mk_sig([a, type_k], [nn_key, pi(x, a, type_k)]),
                definitions: mk_map(),
                type_context: mk_map(['x', a])
            },
            decl_constant(nn_key, type_k)
        )
    ).toEqual(
        identifier_redeclaration(decl_constant(nn_key, type_k))
    ))
})

describe('synthesize_definition_declaration', () => {
    test('given empty ctx, non-empty sig, valid', () => expect(
        synthesize_definition_declaration(
            {
                signature: mk_sig([a, type_k], [b, a]),
                definitions: mk_map(),
                type_context: mk_map()
            },
            decl_definition(x, a, b)
        )
    ).toEqual({
        signature: mk_sig([a, type_k], [b, a]),
        definitions: mk_map(['x', b]),
        type_context: mk_map(['x', a])
    }))
    test('given non-empty ctx and depends on it, non-empty sig, valid', () => expect(
        synthesize_definition_declaration(
            {
                signature: mk_sig([a, type_k], [b, a]),
                // not every variable needs a definition
                definitions: mk_map(['z', b]),
                type_context: mk_map(['z', a], ['y', a])
            },
            decl_definition(x, a, y)
        )
    ).toEqual({
        signature: mk_sig([a, type_k], [b, a]),
        definitions: mk_map(['z', b], ['x', y]),
        type_context: mk_map(['z', a], ['y', a], ['x', a])
    }))
    test('given sort does not check to Type', () => expect(
        synthesize_definition_declaration(
            {
                signature: mk_sig([a, type_k], [b, a]),
                definitions: mk_map(),
                type_context: mk_map()
            },
            decl_definition(x, type_k, a)
        )
    ).toEqual(
        bad_sort_declaration(decl_definition(x, type_k, a), new FailedCheck(type_k, type_k, kind_s))
    ))
    test('given non-empty sig, redeclaration of constant', () => expect(
        synthesize_definition_declaration(
            {
                signature: mk_sig([a, type_k], [b, a], [c, a], [d, type_k]),
                definitions: mk_map(),
                type_context: mk_map()
            },
            decl_definition(ov('d'), a, b)
        )
    ).toEqual(
        identifier_redeclaration(decl_definition(ov('d'), a, b))
    ))
    test('given non-empty sig and ctx, redeclaration of variable', () => expect(
        synthesize_definition_declaration(
            {
                signature: mk_sig([a, type_k]),
                definitions: mk_map(),
                type_context: mk_map(['x', a])
            },
            decl_definition(x, a, b)
        )
    ).toEqual(
        identifier_redeclaration(decl_definition(x, a, b))
    ))
    test('given non-empty sig and ctx, definition sort does not check to given sort', () => expect(
        synthesize_definition_declaration(
            {
                signature: mk_sig([a, type_k], [b, type_k], [c, b]),
                definitions: mk_map(),
                type_context: mk_map(['x', a])
            },
            decl_definition(x, a, c)
        )
    ).toEqual(
        identifier_redeclaration(decl_definition(x, a, c))
    ))
})


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


describe('synthesize module', () => {
    test('empty', () => expect(synthesize_module(empty_module, empty_module_spec)).toEqual(empty_module))
    test('single constant module', () => expect(
        synthesize_module(empty_module, single_constant_module)
    ).toEqual({
        signature: mk_sig([con('cool'), type_k]),
        definitions: mk_map(),
        type_context: mk_map()
    }))
    test('invalid_single_constant_module', () => expect(
        synthesize_module(empty_module, invalid_single_constant_module)
    ).toEqual(
        bad_declaration_in_module(
            bad_sort_declaration(decl_constant(con('cool'), N), new UndeclaredConstant(N)),
            empty_module,
            empty_module_spec
        )
    ))
    test('simple_nat_module', () => expect(
        synthesize_module(empty_module, simple_nat_module)
    ).toEqual({
        signature: mk_sig([N, type_k], ['N', N]),
        definitions: mk_map(),
        type_context: mk_map()
    }))
    test('invalid_simple_nat_module_bad_first', () => expect(
        synthesize_module(empty_module, invalid_simple_nat_module_bad_first)
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
        synthesize_module(empty_module, invalid_simple_nat_module_bad_second)
    ).toEqual(
        bad_child_module(
            decl_constant(N, type_k),
            bad_declaration_in_module(
                bad_sort_declaration(decl_constant(nn_key, con('cool')), new UndeclaredConstant(con('cool'))),
                {
                    signature: mk_sig([N, type_k]),
                    definitions: mk_map(),
                    type_context: mk_map()
                },
                empty_module_spec
            )
        )
    ))
    test('given non-empty module', () => expect(
        synthesize_module(
            {
                signature: mk_sig([a, type_k], [b, a]),
                definitions: mk_map(['z', b], ['x', y]),
                type_context: mk_map(['z', a], ['y', a], ['x', a])
            },
            make_module_spec([
                decl_constant(c, pi(v, a, type_k)),
                decl_constant(d, app(c, b)),
                decl_definition(u, app(c, b), d)
            ])
        )
    ).toEqual({
        signature: mk_sig([a, type_k], [b, a], [c, pi(v, a, type_k)], [d, app(c, b)]),
        definitions: mk_map(['z', b], ['x', y], ['u', d]),
        type_context: mk_map<Ast>(['z', a], ['y', a], ['x', a], ['u', app(c, b)])
    }))
    test('nat_module', () => expect(
        synthesize_module(empty_module, nat_module)
    ).toEqual({
        signature: mk_sig(
            [N, type_k], [O, N], [S, func_type([N], N)], [nn_key, N], [plus, func_type([N, N], N)], [eq, func_type([N, N], type_k)], [refl, pi(x, N, eq_f(x, x))],
            [symm, pi(x, N, pi(y, N, pi(z, eq_f(x, y), eq_f(y, x))))], [tran, pi(x, N, pi(y, N, pi(z, N, pi(u, eq_f(x, y), pi(v, eq_f(y, z), eq_f(x, z))))))],
            [O_eq, eq_f(O, O)], [S_eq, pi(x, N, pi(y, N, pi(z, eq_f(x, y), eq_f(S_f(x), S_f(y)))))], [S_def, pi(x, N, eq_f(S_f(x), plus_f(x, nat(1))))],
            [plus_def, pi(x, N, pi(y, N, eq_f(plus_f(x, S_f(y)), S_f(plus_f(x, y)))))]),
        definitions: mk_map(['eq_2_2', refl_f(nat(2))]),
        type_context: mk_map(['eq_2_2', eq_f(nat(2), nat(2))])
    }))

})

