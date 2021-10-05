import _ from "lodash"
import { AbstractSyntaxTree, Application, Ast, Constant, GeneratedVariable, IndexedMetaVariable, Lambda, MetaVariable, Pi, TypeKind, Variable } from "./ast";
import { is_atom } from "./is_atom";
import { syntactic_equality } from "./syntactic_equality";

export function v_union(vs1: Variable[], vs2: Variable[]): Variable[] {
    const v_equal = (v1: Variable, v2: Variable) => syntactic_equality(v1, v2)
    return _.unionWith(vs1, vs2, v_equal)
}

export function ast_in(ast: AbstractSyntaxTree, set: AbstractSyntaxTree[]): boolean {
    return set.some((e) => syntactic_equality(e, ast))
}

export function vs_in(ast: Ast): Variable[] {
    if (ast instanceof Application)
        return v_union(vs_in(ast.head), vs_in(ast.arg))
    else if (ast instanceof Lambda || ast instanceof Pi)
        return v_union([ast.bound], v_union(vs_in(ast.type), vs_in(ast.scope)))
    else if (ast instanceof Variable)
        return [ast]
    return []
}

function to_factored_string(ast: Ast): string {
    if (is_atom(ast))
        return ast_to_string(ast)
    return `(${ast_to_string(ast)})`
}

export function ast_to_string(ast: Ast): string {
    if (ast instanceof TypeKind)
        return "Type"
    if (ast instanceof Constant)
        return ast.id
    if (ast instanceof Variable)
        return `${ast.id}`
    if (ast instanceof MetaVariable)
        return `?${ast.id}`
    if (ast instanceof Application) {
        if (ast.head instanceof Application)
            return `${ast_to_string(ast.head)} ${to_factored_string(ast.arg)}`
        return `${to_factored_string(ast.head)} ${to_factored_string(ast.arg)}`
    }
    if (ast instanceof Lambda)
        return `λ(${ast.bound.id}: ${ast_to_string(ast.type)}).${ast_to_string(ast.scope)}`
    if (ast instanceof Pi)
        return `Π(${ast.bound.id}: ${ast_to_string(ast.type)}).${ast_to_string(ast.scope)}`
    throw new Error("Can't convert unknown Ast to string")
}

export function max_gv_index_used_in(proof: Ast): number {
    if (proof instanceof GeneratedVariable)
        return proof.index
    if (is_pi(proof) || is_lambda(proof))
        return Math.max(max_gv_index_used_in(proof.bound), max_gv_index_used_in(proof.type), max_gv_index_used_in(proof.scope))
    if (is_application(proof))
        return Math.max(max_gv_index_used_in(proof.head), max_gv_index_used_in(proof.arg))
    return -1
}

export const iovlist = (...indices: number[]): GeneratedVariable[] => indices.map((index) => new GeneratedVariable("", index))

export function max_mv_used_in(proof: Ast): number {
    const gvs = vs_in(proof).filter((v) => v instanceof GeneratedVariable)
    const gv_indices = gvs.map((gv) => gv.get_index())
    return Math.max(...gv_indices)
}

export const is_ast = (ast: unknown): ast is Ast => is_type_kind(ast) || is_variable(ast) || is_constant(ast)
    || is_application(ast) || is_lambda(ast) || is_pi(ast) || is_meta_variable(ast)
export const is_type_kind = (ast: unknown): ast is TypeKind => ast instanceof TypeKind
export const is_variable = (ast: unknown): ast is Variable => ast instanceof Variable
export const is_constant = (ast: unknown): ast is Constant => ast instanceof Constant
export const is_application = (ast: unknown): ast is Application => ast instanceof Application
export const is_lambda = (ast: unknown): ast is Lambda => ast instanceof Lambda
export const is_pi = (ast: unknown): ast is Pi => ast instanceof Pi
export const is_binder = (ast: unknown): ast is Lambda | Pi => is_lambda(ast) || is_pi(ast)
export const is_meta_variable = (ast: unknown): ast is MetaVariable => ast instanceof MetaVariable
export const is_indexed_meta_variable = (ast: unknown): ast is IndexedMetaVariable => ast instanceof IndexedMetaVariable
export const is_indexed_variable = (ast: unknown): ast is GeneratedVariable => ast instanceof GeneratedVariable && ast.base_id === ""
export const is_generated_variable = (ast: unknown): ast is GeneratedVariable => ast instanceof GeneratedVariable
