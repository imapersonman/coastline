import { Ast } from "../lambda_pi/ast";
import { la, ov } from "../lambda_pi/shorthands";
import { Ctx } from "./ctx";

// Returns an Ast with all variables declared in the given ctx introduced in a Lambda.
// If an empty Ctx is given, just return the given Ast.
export const introduce_ctx = (ctx: Ctx, ast: Ast): Ast =>
    ctx.entries().reverse().reduce((acc, [id, type]) => la(ov(id).parse(), type, acc), ast)