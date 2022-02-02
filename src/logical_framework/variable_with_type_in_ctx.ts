import { Ast, Variable } from "../lambda_pi/ast";
import { beta_eta_equality } from "../lambda_pi/beta_eta_equality";
import { ov } from "../lambda_pi/shorthands";
import { Ctx } from "./ctx";

export const variable_with_type_in_ctx = (type: Ast, ctx: Ctx): Variable | undefined => {
    if (ctx.is_empty())
        return undefined
    if (beta_eta_equality(ctx.head()[1], type))
        return ov(ctx.head()[0])
    return variable_with_type_in_ctx(type, ctx.tail())
}