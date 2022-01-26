import { AbstractSyntaxTree, Constant, MetaVariable, TypeKind, Variable } from "./ast";
import { Atom } from "./utilities";

export function is_atom(ast: AbstractSyntaxTree): ast is Atom {
    return ast instanceof TypeKind
        || ast instanceof Constant
        || ast instanceof Variable
        || ast instanceof MetaVariable
}