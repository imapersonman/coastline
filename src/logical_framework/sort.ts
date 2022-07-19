import { Ast } from "../lambda_pi/ast";
import { ast_to_string, is_ast } from "../lambda_pi/utilities";

export type Sort = Ast | KindSort

export class KindSort {}

export const kind_s = new KindSort

export const is_kind_sort = (s: any): s is KindSort => s instanceof KindSort

export const is_sort = (s: unknown): s is Sort => is_kind_sort(s) || is_ast(s)

export const display_sort = (s: Sort): string => is_kind_sort(s) ? "Kind" : ast_to_string(s)