import { Ast } from "../lambda_pi/ast";
import { ast_to_string } from "../lambda_pi/utilities";

export type Sort = Ast | KindSort

export class KindSort {}

export const display_sort = (s: Sort): string => s instanceof KindSort ? "Kind" : ast_to_string(s)