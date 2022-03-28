import { AbstractSyntaxTree, Constant, MetaVariable, TypeKind, Variable } from "./ast";
import { Atom } from "./utilities";

// Suspensions aren't considered atomic, so this function doesn't change with their addition.
// - Koissi, 3/26/2022.

export function is_atom(ast: AbstractSyntaxTree): ast is Atom {
    return ast instanceof TypeKind
        || ast instanceof Constant
        || ast instanceof Variable
        || ast instanceof MetaVariable
}