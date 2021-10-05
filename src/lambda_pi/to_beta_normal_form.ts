import { AbstractSyntaxTree, Application, Constant, Lambda, Pi, TypeKind, Variable } from "./ast"
import { is_atom } from "./is_atom"
import { binder_of_same_class, substitute } from "./substitute"

type Ast = AbstractSyntaxTree

export function to_beta_normal_form(ast: Ast): Ast {
    const nf_or_undefined = atom_to_beta_normal_form(ast)
        || binder_to_beta_normal_form(ast)
        || application_to_beta_normal_form(ast)
    if (nf_or_undefined === undefined)
        throw new Error(`Normal form is undefined for an unknown reason: ${JSON.stringify(ast)}`)
    return nf_or_undefined
}

function atom_to_beta_normal_form(ast: Ast): Ast | undefined {
    if (is_atom(ast))
        return ast
    return undefined
}

function binder_to_beta_normal_form(ast: Ast): Ast | undefined {
    if (!(ast instanceof Lambda || ast instanceof Pi))
        return undefined
    const mod_t = to_beta_normal_form(ast.type)
    const mod_s = to_beta_normal_form(ast.scope)
    return binder_of_same_class(ast, ast.bound, mod_t, mod_s)
}

function application_to_beta_normal_form(ast: Ast): Ast | undefined {
    if (!(ast instanceof Application))
        return undefined
    const mod_h = to_beta_normal_form(ast.head)
    const mod_a = to_beta_normal_form(ast.arg)
    return possibly_beta_reduce(mod_h, mod_a)
}

export function possibly_beta_reduce(head: Ast, arg: Ast): Ast {
    if (head instanceof Lambda)
        return to_beta_normal_form(substitute(head.bound, arg, head.scope))
    return new Application(head, arg)
}

