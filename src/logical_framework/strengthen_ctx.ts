import { Ast } from "../lambda_pi/ast"
import { vs_in } from "../lambda_pi/utilities"
import { mk_map } from "../map/RecursiveMap"
import { Ctx } from "./ctx"

export const strengthen_ctx = (ctx: Ctx, ast: Ast): Ctx => {
    const variables_in_ast = new Set(vs_in(ast).map((v) => v.id))
    return mk_map(...ctx.entries().filter(([id]) => variables_in_ast.has(id)))
}
