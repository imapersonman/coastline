import { ov } from "../../src/lambda_pi/shorthands";
import { ctx_union, IncompatibleCtxs } from "../../src/logical_framework/ctx_union";
import { mk_map } from "../../src/map/RecursiveMap";


describe('ctx_union', () => {
    test('empties', () => expect(
        ctx_union(mk_map(), mk_map())
    ).toEqual(
        mk_map()
    ))

    test('left empty', () => expect(
        ctx_union(mk_map(), mk_map(["a", ov("A")], ["b", ov("B")], ["c", ov("C")]))
    ).toEqual(
        mk_map(["a", ov("A")], ["b", ov("B")], ["c", ov("C")])
    ))

    test('right empty', () => expect(
        ctx_union(mk_map(["a", ov("A")], ["b", ov("B")], ["c", ov("C")]), mk_map())
    ).toEqual(
        mk_map(["a", ov("A")], ["b", ov("B")], ["c", ov("C")])
    ))

    test('disjoint', () => expect(
        ctx_union(mk_map(["a", ov("A")], ["b", ov("B")], ["c", ov("C")]), mk_map(["x", ov("X")], ["y", ov("Y")], ["z", ov("Z")]))
    ).toEqual(
        mk_map(["a", ov("A")], ["b", ov("B")], ["c", ov("C")], ["x", ov("X")], ["y", ov("Y")], ["z", ov("Z")])
    ))

    test('non-disjont', () => expect(
        ctx_union(mk_map(["a", ov("A")], ["y", ov("Y")], ["c", ov("C")]), mk_map(["x", ov("X")], ["y", ov("Y")], ["a", ov("A")]))
    ).toEqual(
        mk_map(["a", ov("A")], ["y", ov("Y")], ["c", ov("C")], ["x", ov("X")])
    ))

    test('conflicting', () => expect(
        ctx_union(mk_map(["a", ov("A")], ["y", ov("P")], ["c", ov("C")]), mk_map(["x", ov("X")], ["y", ov("Y")], ["a", ov("A")]))
    ).toEqual(
        new IncompatibleCtxs(
            mk_map(["a", ov("A")], ["y", ov("P")], ["c", ov("C")]),
            mk_map(["x", ov("X")], ["y", ov("Y")], ["a", ov("A")]),
            ov("y"),
            ov("P"),
            ov("Y")
        )
    ))
})