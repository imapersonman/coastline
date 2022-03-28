import { Ast } from "./ast";
import { children_of } from "./children_of";
import { syntactic_equality } from "./syntactic_equality";

// Suspensions don't change the implementation of this function, since the meta-variables
// within them may or may not contain the variables in their swaps.
// - Koissi, 3/26/2022.

export const contains = (parent: Ast, child: Ast): boolean =>
    children_of(parent).some((c) => syntactic_equality(child, c) || contains(c, child))