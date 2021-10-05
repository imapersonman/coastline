import { AbstractSyntaxTree, Constant, MetaVariable, TypeKind, Variable } from "./ast";

export function is_atom(ast: AbstractSyntaxTree): boolean {
    return ast instanceof TypeKind
        || ast instanceof Constant
        || ast instanceof Variable
        || ast instanceof MetaVariable
}