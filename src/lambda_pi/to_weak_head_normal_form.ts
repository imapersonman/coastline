import { AbstractSyntaxTree, Application, Constant, Lambda, MetaVariable, Pi, TypeKind, Variable } from "./ast";
import { substitute } from "./substitute";

type Ast = AbstractSyntaxTree

export function to_weak_head_normal_form(ast: Ast): Ast {
    const nf_or_undefined = unchanged_to_weak_head_normal_form(ast)
        ?? application_to_weak_head_normal_form(ast)
    if (nf_or_undefined === undefined)
        throw new Error("Normal form is undefined for an unknown reason: " + JSON.stringify(ast))
    return nf_or_undefined
}

function unchanged_to_weak_head_normal_form(ast: Ast): Ast | undefined {
    if (ast instanceof Constant
        || ast instanceof Variable
        || ast instanceof Lambda
        || ast instanceof Pi
        || ast instanceof TypeKind
        || ast instanceof MetaVariable)
        return ast
    return undefined
}

function application_to_weak_head_normal_form(ast: Ast): Ast | undefined {
    if (!(ast instanceof Application))
        return undefined
    const head_nf = to_weak_head_normal_form(ast.head)
    if (!(head_nf instanceof Lambda))
        return new Application(head_nf, ast.arg)
    const beta_reduced = substitute(head_nf.bound, ast.arg, head_nf.scope)
    return to_weak_head_normal_form(beta_reduced)
}