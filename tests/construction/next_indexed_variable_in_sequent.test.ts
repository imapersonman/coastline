import { next_indexed_variable_in_sequent } from "../../src/construction/next_indexed_variable_in_sequent"
import { sequent } from "../../src/construction/sequent"
import { app, iv, ov, type_k } from "../../src/lambda_pi/shorthands"
import { mk_map } from "../../src/map/RecursiveMap"

test('no generated variable in assumptions or conclusion', () => expect(
    next_indexed_variable_in_sequent(sequent(mk_map(), type_k))
).toEqual(
    iv(0)
))

test('max generated variable in assumptions', () => expect(
    next_indexed_variable_in_sequent(sequent(mk_map(["$_-4", type_k], ["b", type_k], ["c", app(iv(4), ov("a"))]), iv(3)))
).toEqual(
    iv(5)
))

test('max generated variable in conclusion', () => expect(
    next_indexed_variable_in_sequent(sequent(mk_map(["$_-4", type_k], ["b", type_k], ["c", app(iv(4), ov("a"))]), iv(6)))
).toEqual(
    iv(7)
))