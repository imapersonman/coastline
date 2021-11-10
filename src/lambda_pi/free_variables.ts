import _ from "lodash";
import { AbstractSyntaxTree, Application, Constant, Lambda, MetaVariable, Pi, TypeKind, Variable } from "./ast";
import { ast_in, v_union } from "./utilities";

type Ast = AbstractSyntaxTree

export function free_variables(bvs: Variable[], ast: Ast): Variable[] {
    return differentiate(ast,
        (v) => ast_in(v, bvs) ? [] : [v],
        () => [],
        (b, t, s) => v_union(
            free_variables(bvs, t),
            free_variables(v_union(bvs, [b]), s)),
        (h, a) => _.union(free_variables(bvs, h), free_variables(bvs, a)))
}

export function differentiate<R>(ast: Ast,
    fv: (v: Variable) => R,
    fa: () => R,
    fb: (b: Variable, t: Ast, s: Ast) => R,
    fnb: (h: Ast, a: Ast) => R): R {
    if (ast instanceof Variable)
        return fv(ast)
    else if (ast instanceof TypeKind || ast instanceof Constant || ast instanceof MetaVariable)
        return fa()
    else if (ast instanceof Lambda || ast instanceof Pi)
        return fb(ast.bound, ast.type, ast.scope)
    else if (ast instanceof Application)
        return fnb(ast.head, ast.arg)
    throw new Error(`Cannot differentiate an unknown Ast instance: ${JSON.stringify(ast)}`)
}