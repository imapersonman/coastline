import { AbstractSyntaxTree, Application, Constant, Lambda, MetaVariable, Pi, TypeKind, Variable } from "./ast";

type Ast = AbstractSyntaxTree
export function syntactic_equality(ast1: Ast, ast2: Ast): boolean {
    if (ast1 instanceof TypeKind && ast2 instanceof TypeKind)
        return true
    if (ast1 instanceof Constant && ast2 instanceof Constant)
        return ast1.id === ast2.id
    if (ast1 instanceof Variable && ast2 instanceof Variable)
        return ast1.id === ast2.id
    if (ast1 instanceof MetaVariable && ast2 instanceof MetaVariable)
        return ast1.id === ast2.id
    if (ast1 instanceof Application && ast2 instanceof Application)
        return syntactic_equality(ast1.head, ast2.head)
            && syntactic_equality(ast1.arg, ast2.arg)
    if (ast1 instanceof Lambda && ast2 instanceof Lambda)
        return syntactic_equality(ast1.bound, ast2.bound)
            && syntactic_equality(ast1.type, ast2.type)
            && syntactic_equality(ast1.scope, ast2.scope)
    if (ast1 instanceof Pi && ast2 instanceof Pi)
        return syntactic_equality(ast1.bound, ast2.bound)
            && syntactic_equality(ast1.type, ast2.type)
            && syntactic_equality(ast1.scope, ast2.scope)
    return false
}