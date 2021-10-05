import { Ast } from "../lambda_pi/ast"
import { RelativelyNamedAst } from "./relatively_named_ast"

export class Insert { constructor(readonly new_conclusions: Ast[], readonly fragment: RelativelyNamedAst) {} }
export const is_insert = (i: any): i is Insert => i instanceof Insert
export const insert = (new_conclusions: Ast[], fragment: RelativelyNamedAst) => new Insert(new_conclusions, fragment)