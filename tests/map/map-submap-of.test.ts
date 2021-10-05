import { mk_map, RecursiveMap } from "../../src/map/RecursiveMap"
import { submap_of } from "../../src/map/compare"

type RM<V> = RecursiveMap<V>

const n_eq = (n1: number, n2: number) => n1 === n2
const test_sm_of = (n: string, sm: RM<number>, of: RM<number>, out: boolean) =>
    test(`submap_of ${n}`, () => expect(submap_of(sm, of, n_eq)).toEqual(out))

test_sm_of("empty of empty", mk_map(), mk_map(), true)
test_sm_of("empty of non-empty 1", mk_map(), mk_map(["one", 1]), true)
test_sm_of("empty of non-empty 3", mk_map(), mk_map(["one", 1], ["two", 2], ["three", 3]), true)
test_sm_of("map of self 1", mk_map(["one", 1]), mk_map(["one", 1]), true)
test_sm_of("map of self 2", mk_map(["one", 1], ["two", 2]), mk_map(["one", 1], ["two", 2]), true)
test_sm_of("strict 2 of 4", mk_map(["one", 1], ["two", 2]), mk_map(["one", 1], ["two", 2], ["three", 3], ["four", 4]), true)
test_sm_of("not 4 of 2", mk_map(["one", 1], ["two", 2], ["three", 3], ["four", 4]), mk_map(["one", 1], ["two", 2]), false)
test_sm_of("not self of different value", mk_map(["one", 1]), mk_map(["one", 2]), false)
test_sm_of("not self of different key", mk_map(["one", 2]), mk_map(["two", 1]), false)
test_sm_of("self of rearranged 2", mk_map(["one", 1], ["two", 2]), mk_map(["two", 2], ["one", 1]), true)