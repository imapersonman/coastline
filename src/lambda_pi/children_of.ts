import { Application, Ast, Lambda, Pi } from "./ast";

export const children_of = (ast: Ast): Ast[] =>
    ast instanceof Application ? [ast.head, ast.arg]
    : ast instanceof Lambda ? [ast.type, ast.scope]
    : ast instanceof Pi ? [ast.type, ast.scope]
    : []
