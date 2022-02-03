import { app, clist, imv, iv, la, ovlist, pi, type_k } from "../../src/lambda_pi/shorthands"
import { mk_map } from "../../src/map/RecursiveMap"
import { BadChildSort, FailedCheck, RedeclaredVariable, UndeclaredConstant, UndeclaredVariable } from "../../src/logical_framework/sort_errors"
import { sequent } from "../../src/construction/sequent"
import { check_proof_insert, FailedSubProblem, InvalidProofInsertWithBadFragment, InvalidProofInsertWithBadNewConclusions, SubProblem, ValidProofInsert } from "../../src/construction/check_proof_insert"
import { KindSort } from "../../src/logical_framework/sort"
import { run_test } from "../run_test"
import { mk_sig } from "../../src/logical_framework/sig2"

const [a, b, c] = clist("a", "b", "c")
const [x, y, z] = ovlist("x", "y", "z")
const kind_s = new KindSort

run_test(check_proof_insert, [
    "SortError",
    mk_sig([a, type_k], [b, pi(x, a, type_k)]),
    mk_map(),
    sequent(mk_map(["y", a]), type_k),
    [a],
    (m, v) => z,
    // It doesn't matter what I pass in for m and v since they aren't called in the RelativelyNamedAst
    (i) => undefined,
    (i) => undefined,
    new InvalidProofInsertWithBadFragment(mk_map(["y", a]), z, new UndeclaredVariable(z))
])

run_test(check_proof_insert, [
    "1 Sequent",
    mk_sig([a, type_k], [b, pi(x, a, type_k)]),
    mk_map(),
    sequent(mk_map(["y", a]), pi(x, a, pi(y, a, type_k))),
    [pi(x, a, a)],
    (m, v) => la(v(1), a, la(v(0), a, app(b, app(m(0), v(0))))),
    imv,
    iv,
    new ValidProofInsert(
        la(iv(1), a, la(iv(0), a, app(b, app(imv(0), iv(0))))),
        [iv(0), iv(1)],
        [new SubProblem(imv(0), sequent(mk_map(["$_1", a], ["$_0", a]), pi(x, a, a)))])
])

run_test(check_proof_insert, [
    "2 Sequents",
    mk_sig([a, type_k], [b, pi(x, a, type_k)]),
    mk_map(),
    sequent(mk_map(["y", a]), type_k),
    [a, pi(x, a, a)],
    (m, v) => app(b, app(m(3), m(-1))),
    imv,
    iv,
    new ValidProofInsert(
        app(b, app(imv(3), imv(-1))),
        [],
        [new SubProblem(imv(-1), sequent(mk_map(), a)), new SubProblem(imv(3), sequent(mk_map(), pi(x, a, a)))])
])

run_test(check_proof_insert, [
    "2 Sequents",
    mk_sig([a, type_k], [b, pi(x, a, type_k)]),
    mk_map(),
    sequent(mk_map(["y", a]), type_k),
    [a, pi(x, a, a)],
    (m, v) => app(b, app(m(3), m(-1))),
    imv,
    iv,
    new ValidProofInsert(
        app(b, app(imv(3), imv(-1))),
        [],
        [new SubProblem(imv(-1), sequent(mk_map(), a)), new SubProblem(imv(3), sequent(mk_map(), pi(x, a, a)))])
])

run_test(check_proof_insert, [
    "2 SortErrors",
    mk_sig([a, type_k], [b, pi(x, a, type_k)]),
    mk_map(),
    sequent(mk_map(["y", a]), type_k),
    [type_k, z],
    (m, v) => app(m(-1), m(3)),
    imv,
    iv,
    new InvalidProofInsertWithBadNewConclusions(app(imv(-1), imv(3)), [
        new FailedSubProblem(imv(-1), new FailedCheck(type_k, type_k, kind_s)),
        new FailedSubProblem(imv(3), new UndeclaredVariable(z))
    ])
])

run_test(check_proof_insert, [
    "3 undefined (mvs corresponding to given new_conclusions don't appear in fragment)",
    mk_sig([a, type_k], [b, pi(x, a, type_k)]),
    mk_map(),
    sequent(mk_map(["y", a]), a),
    [a, a, a],
    (m, v) => y,
    imv,
    iv,
    new ValidProofInsert(y, [], [])
])

run_test(check_proof_insert, [
    "mixed",
    mk_sig([a, type_k], [b, pi(x, a, type_k)]),
    mk_map(),
    sequent(mk_map(["y", a]), type_k),
    [c, a, a],
    (m, v) => app(m(0), m(1)),
    imv,
    iv,
    new InvalidProofInsertWithBadNewConclusions(app(imv(0), imv(1)), [
        new FailedSubProblem(imv(0), new UndeclaredConstant(c)),
        new SubProblem(imv(1), sequent(mk_map(), a))])
])

run_test(check_proof_insert, [
    "indexed variable in ctx and ast (avoided redeclaration error)",
    mk_sig([a, type_k], [b, pi(x, a, type_k)]),
    mk_map(),
    sequent(mk_map(["y", a], [iv(0).id, type_k]), pi(x, a, type_k)),
    [],
    (m, v) => la(v(0), a, app(b, y)),
    imv,
    (i) => iv(1 + i),
    new ValidProofInsert(la(iv(1), a, app(b, y)), [iv(1)], [])
])

run_test(check_proof_insert, [
    "indexed variable in ctx and ast (with redeclaration error)",
    mk_sig([a, type_k], [b, pi(x, a, type_k)]),
    mk_map(),
    sequent(mk_map(["y", a], [iv(0).id, type_k]), pi(x, a, type_k)),
    [],
    (m, v) => la(v(0), a, app(b, y)),
    imv,
    iv,
    new InvalidProofInsertWithBadFragment(
        mk_map(["y", a], [iv(0).id, type_k]),
        la(iv(0), a, app(b, y)),
        new BadChildSort(
            la(iv(0), a, app(b, y)),
            new RedeclaredVariable(iv(0))))
])

run_test(check_proof_insert, [
    "indexed variable in ctx and ast (with redeclaration error from outer_ctx)",
    mk_sig([a, type_k], [b, pi(x, a, type_k)]),
    mk_map([iv(1).id, a]),
    sequent(mk_map(["y", a], [iv(0).id, type_k]), pi(x, a, type_k)),
    [],
    (m, v) => la(v(1), a, app(b, y)),
    imv,
    iv,
    new InvalidProofInsertWithBadFragment(
        mk_map([iv(1).id, a], ["y", a], [iv(0).id, type_k]),
        la(iv(1), a, app(b, y)),
        new BadChildSort(
            la(iv(1), a, app(b, y)),
            new RedeclaredVariable(iv(1))))
])

