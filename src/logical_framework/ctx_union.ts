import { Variable } from "../lambda_pi/ast"
import { beta_eta_equality } from "../lambda_pi/beta_eta_equality"
import { ov } from "../lambda_pi/shorthands"
import { map_lookup_key_not_found, mk_map } from "../map/RecursiveMap"
import { Ctx } from "./ctx"
import { Sort } from "./sort"

export class IncompatibleCtxs { constructor(readonly cxt1: Ctx, readonly ctx2: Ctx, readonly variable: Variable, readonly sort1: Sort, readonly sort2: Sort) {} }
export const is_incompatible_ctxs = (i: unknown): i is IncompatibleCtxs => i instanceof IncompatibleCtxs

export const ctx_union = (c1: Ctx, c2: Ctx): Ctx | IncompatibleCtxs => {
    const ctx_rev_union = (c1p: Ctx, rev_c2: Ctx): Ctx | IncompatibleCtxs => {
        if (rev_c2.is_empty())
            return c1p
        const id = rev_c2.head()[0]
        const sort = rev_c2.head()[1]
        const sort_in_c1 = c1p.lookup(id)
        if (map_lookup_key_not_found(sort_in_c1))
            return ctx_rev_union(c1p.add(id, sort), rev_c2.tail())
        if (beta_eta_equality(sort_in_c1, sort))
            return ctx_rev_union(c1p, rev_c2.tail())
        return new IncompatibleCtxs(c1, c2, ov(id), sort_in_c1, sort)
    }
    return ctx_rev_union(c1, mk_map(...c2.entries().reverse()))
}

