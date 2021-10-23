import { check_sequent } from "../../src/construction/check_sequent"
import { sequent } from "../../src/construction/sequent"
import { con, type_k } from "../../src/lambda_pi/shorthands"
import { BadEntry } from "../../src/logical_framework/ctx_errors"
import { KindSort } from "../../src/logical_framework/sort"
import { FailedCheck, UndeclaredConstant } from "../../src/logical_framework/sort_errors"
import { mk_map } from "../../src/map/RecursiveMap"

describe("check_sequent makes sure a sequent is valid under a given signature", () => {
    it("succeeds on an empty ctx and valid conclusion", () => 
        expect(
            check_sequent(mk_map(["a", type_k]), sequent(mk_map(), con("a")))
        ).toEqual(
            []
        )
    )
    it("succeeds on a non-empty ctx and valid conclusion", () =>
        expect(
            check_sequent(mk_map(["a", type_k], ["b", type_k]), sequent(mk_map(["x", con("a")]), con("b")))
        ).toEqual(
            []
        )
    )
    it("fails on an invalid non-empty ctx and valid conclusion", () =>
        expect(
            check_sequent(mk_map(), sequent(mk_map(["x", con("a")]), type_k))
        ).toEqual(
            new BadEntry("x", new UndeclaredConstant(con("a")))
        )
    )
    it("fails on a valid non-empty ctx and invalid conclusion", () => 
        expect(
            check_sequent(mk_map(["a", type_k], ["b", type_k]), sequent(mk_map(["x", con("a")], ["y", con("b")]), type_k))
        ).toEqual(
            new FailedCheck(type_k, type_k, new KindSort)
        )
    )
    it("fails on an invalid non-empty ctx and invalid conclusion, but reports the ctx error", () =>
        expect(
            check_sequent(mk_map(["b", type_k]), sequent(mk_map(["x", con("a")], ["y", con("b")]), type_k))
        ).toEqual(
            new BadEntry("x", new UndeclaredConstant(con("a")))
        )
    )
})