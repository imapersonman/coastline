import { Ast } from "../lambda_pi/ast";
import { ast_to_string } from "../lambda_pi/utilities";
import { RecursiveMap } from "../map/RecursiveMap";

export type Ctx = RecursiveMap<Ast>

export const display_ctx = (ctx: Ctx) => ctx.entries().map(([id, type]) => `${id}: ${ast_to_string(type)}`)