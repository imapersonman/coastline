import { Ast, MetaVariable } from "../lambda_pi/ast"
import { is_application, is_binder, is_meta_variable } from "../lambda_pi/utilities"
import { mk_map } from "../map/RecursiveMap"
import { Ctx } from "../logical_framework/ctx"
import { defined, fit_arrays, invert_string_array, replace_at_index } from "../utilities"

/*
Looks for each MetaVariable in meta_variables and returns the Ctx that each one "sees" in the given ast.
*/
export const ctxs_at_meta_variables = (ast: Ast, mvs: MetaVariable[]): (Ctx | undefined)[] => {
    const mv_index_by_id = invert_string_array(mvs.map((mv) => mv.id))
    const ctxs_at_mvs = (ast: Ast, ctx: Ctx, acc: (Ctx | undefined)[]): (Ctx | undefined)[] =>
        is_meta_variable(ast) && defined(mv_index_by_id[ast.id]) ? replace_at_index(acc, mv_index_by_id[ast.id], ctx)
        : is_application(ast)   ? fit_arrays(ctxs_at_mvs(ast.head, ctx, acc), ctxs_at_mvs(ast.arg, ctx, acc))
        : is_binder(ast)        ? fit_arrays(ctxs_at_mvs(ast.type, ctx, acc), ctxs_at_mvs(ast.scope, ctx.add(ast.bound.id, ast.type), acc))
        : acc
    return ctxs_at_mvs(ast, mk_map(), new Array(mvs.length).fill(undefined))
}