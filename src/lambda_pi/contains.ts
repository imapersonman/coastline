import { Application, Ast, Lambda, Pi } from "./ast";
import { syntactic_equality } from "./syntactic_equality";

export function contains(parent: Ast, child: Ast): boolean {
    const children_of = (ast: Ast): Ast[] =>
        ast instanceof Application ? [ast.head, ast.arg]
        : ast instanceof Lambda ? [ast.type, ast.scope]
        : ast instanceof Pi ? [ast.type, ast.scope]
        : []
    return children_of(parent).some((c) => syntactic_equality(child, c) || contains(c, child))
}