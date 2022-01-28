import { ovlist } from "../../src/lambda_pi/shorthands"
import { strengthen_ctx } from "../../src/logical_framework/strengthen_ctx"
import { and, o } from "../../src/maclogic/maclogic_shorthands"
import { mk_map } from "../../src/map/RecursiveMap"

const [A, B] = ovlist('A', 'B')

describe('strengthen_ctx', () => {
    it('returns an empty ctx with any Ast when given an empty Ctx', () => expect(
        strengthen_ctx(mk_map(), and(A, B))
    ).toEqual(
        mk_map()
    ))
    it("returns an empty ctx with any Ast when given a Variable that doesn't appear in that singleton Ctx", () => expect(
        strengthen_ctx(mk_map(['A', o]), B)
    ).toEqual(
        mk_map()
    ))
    // should just freak out if the value was already declared so don't worry about that case
    it('Keeps every variable if every variable in the Ctx appears in the Ast', () => expect(
        strengthen_ctx(mk_map(['A', o], ['B', o]), and(A, B))
    ).toEqual(
        mk_map(['A', o], ['B', o])
    ))
    it('Keeps every variable if every variable in the Ctx appears in the Ast, and removes all the others', () => expect(
        strengthen_ctx(mk_map(['A', o], ['C', o], ['B', o], ['D', o]), and(A, B))
    ).toEqual(
        mk_map(['A', o], ['B', o])
    ))
})
