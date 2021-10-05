import { Ast, MetaVariable, Variable } from "../lambda_pi/ast";
import { IndexedValue } from "./indexed_value";

export type RelativelyNamedAst = (m: IndexedValue<MetaVariable>, v: IndexedValue<Variable>) => Ast

export const is_relatively_named_ast = (r: any): r is RelativelyNamedAst =>
    r instanceof Function && r.length === 2