import { Ast } from "../lambda_pi/ast"
import { app } from "../lambda_pi/shorthands"
import { binder_of_same_class } from "../lambda_pi/substitute"
import { is_application, is_binder, is_variable } from "../lambda_pi/utilities"
import { Ctx } from "../logical_framework/ctx"
import { variable_with_type_in_ctx } from "../logical_framework/variable_with_type_in_ctx"
import { defined } from "../utilities"

export const use_newest_variables = (ctx: Ctx, ast: Ast, change_pred: (t: Ast) => boolean): Ast => {
    if (is_variable(ast)) {
        const type = ctx.lookup(ast.id)
        if (defined(type) && change_pred(type))
            return variable_with_type_in_ctx(type, ctx) ?? ast
        return ast
    } else if (is_application(ast)) {
        return app(
            use_newest_variables(ctx, ast.head, change_pred),
            use_newest_variables(ctx, ast.arg, change_pred)
        )
    } else if (is_binder(ast)) {
        return binder_of_same_class(
            ast,
            ast.bound,
            use_newest_variables(ctx, ast.type, change_pred),
            use_newest_variables(ctx.add(ast.bound.id, ast.type), ast.scope, change_pred))
    } else {
        return ast
    }
}

