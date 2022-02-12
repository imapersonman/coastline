import { Ast } from "./ast";
import { children_of } from "./children_of";
import { syntactic_equality } from "./syntactic_equality";

export const contains = (parent: Ast, child: Ast): boolean =>
    children_of(parent).some((c) => syntactic_equality(child, c) || contains(c, child))