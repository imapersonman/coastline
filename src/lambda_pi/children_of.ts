import { Application, Ast, Lambda, Pi, Suspension } from "./ast";

// Suspensions don't change the implementation of this function, since the meta-variables
// within them may or may not contain the variables in their swaps.
// - Koissi, 3/26/2022.

// YEAH BUT THE META-VARIABLES INSIDE SUSPENSIONS SHOULD BE CONSIDERED CHILDREN OF THEIR
// ENCLOSING SUSPENSION WHAT WAS I THINKING.
// - Koissi 3/28/2022.

export const children_of = (ast: Ast): Ast[] =>
    ast instanceof Application ? [ast.head, ast.arg]
    : ast instanceof Lambda ? [ast.type, ast.scope]
    : ast instanceof Pi ? [ast.type, ast.scope]
    : ast instanceof Suspension ? [ast.meta_variable]
    : []
