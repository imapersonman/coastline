"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shorthands_1 = require("../../src/lambda_pi/shorthands");
const RecursiveMap_1 = require("../../src/map/RecursiveMap");
const sort_errors_1 = require("../../src/logical_framework/sort_errors");
const sequent_1 = require("../../src/construction/sequent");
const check_proof_insert_1 = require("../../src/construction/check_proof_insert");
const sort_1 = require("../../src/logical_framework/sort");
const run_test_1 = require("../run_test");
const [a, b, c] = (0, shorthands_1.clist)("a", "b", "c");
const [x, y, z] = (0, shorthands_1.ovlist)("x", "y", "z");
const kind_s = new sort_1.KindSort;
(0, run_test_1.run_test)(check_proof_insert_1.check_proof_insert, [
    "SortError",
    (0, RecursiveMap_1.mk_map)(["a", shorthands_1.type_k], ["b", (0, shorthands_1.pi)(x, a, shorthands_1.type_k)]),
    (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["y", a]), shorthands_1.type_k),
    [a],
    (m, v) => z,
    // It doesn't matter what I pass in for m and v since they aren't called in the RelativelyNamedAst
    (i) => undefined,
    (i) => undefined,
    new check_proof_insert_1.InvalidProofInsertWithBadFragment(z, new sort_errors_1.UndeclaredVariable(z))
]);
(0, run_test_1.run_test)(check_proof_insert_1.check_proof_insert, [
    "1 Sequent",
    (0, RecursiveMap_1.mk_map)(["a", shorthands_1.type_k], ["b", (0, shorthands_1.pi)(x, a, shorthands_1.type_k)]),
    (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["y", a]), (0, shorthands_1.pi)(x, a, (0, shorthands_1.pi)(y, a, shorthands_1.type_k))),
    [(0, shorthands_1.pi)(x, a, a)],
    (m, v) => (0, shorthands_1.la)(v(1), a, (0, shorthands_1.la)(v(0), a, (0, shorthands_1.app)(b, (0, shorthands_1.app)(m(0), v(0))))),
    shorthands_1.imv,
    shorthands_1.iv,
    new check_proof_insert_1.ValidProofInsert((0, shorthands_1.la)((0, shorthands_1.iv)(1), a, (0, shorthands_1.la)((0, shorthands_1.iv)(0), a, (0, shorthands_1.app)(b, (0, shorthands_1.app)((0, shorthands_1.imv)(0), (0, shorthands_1.iv)(0))))), [(0, shorthands_1.iv)(0), (0, shorthands_1.iv)(1)], [new check_proof_insert_1.SubProblem((0, shorthands_1.imv)(0), (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["$_1", a], ["$_0", a]), (0, shorthands_1.pi)(x, a, a)))])
]);
(0, run_test_1.run_test)(check_proof_insert_1.check_proof_insert, [
    "2 Sequents",
    (0, RecursiveMap_1.mk_map)(["a", shorthands_1.type_k], ["b", (0, shorthands_1.pi)(x, a, shorthands_1.type_k)]),
    (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["y", a]), shorthands_1.type_k),
    [a, (0, shorthands_1.pi)(x, a, a)],
    (m, v) => (0, shorthands_1.app)(b, (0, shorthands_1.app)(m(3), m(-1))),
    shorthands_1.imv,
    shorthands_1.iv,
    new check_proof_insert_1.ValidProofInsert((0, shorthands_1.app)(b, (0, shorthands_1.app)((0, shorthands_1.imv)(3), (0, shorthands_1.imv)(-1))), [], [new check_proof_insert_1.SubProblem((0, shorthands_1.imv)(-1), (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(), a)), new check_proof_insert_1.SubProblem((0, shorthands_1.imv)(3), (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(), (0, shorthands_1.pi)(x, a, a)))])
]);
(0, run_test_1.run_test)(check_proof_insert_1.check_proof_insert, [
    "2 Sequents",
    (0, RecursiveMap_1.mk_map)(["a", shorthands_1.type_k], ["b", (0, shorthands_1.pi)(x, a, shorthands_1.type_k)]),
    (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["y", a]), shorthands_1.type_k),
    [a, (0, shorthands_1.pi)(x, a, a)],
    (m, v) => (0, shorthands_1.app)(b, (0, shorthands_1.app)(m(3), m(-1))),
    shorthands_1.imv,
    shorthands_1.iv,
    new check_proof_insert_1.ValidProofInsert((0, shorthands_1.app)(b, (0, shorthands_1.app)((0, shorthands_1.imv)(3), (0, shorthands_1.imv)(-1))), [], [new check_proof_insert_1.SubProblem((0, shorthands_1.imv)(-1), (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(), a)), new check_proof_insert_1.SubProblem((0, shorthands_1.imv)(3), (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(), (0, shorthands_1.pi)(x, a, a)))])
]);
(0, run_test_1.run_test)(check_proof_insert_1.check_proof_insert, [
    "2 SortErrors",
    (0, RecursiveMap_1.mk_map)(["a", shorthands_1.type_k], ["b", (0, shorthands_1.pi)(x, a, shorthands_1.type_k)]),
    (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["y", a]), shorthands_1.type_k),
    [shorthands_1.type_k, z],
    (m, v) => (0, shorthands_1.app)(m(-1), m(3)),
    shorthands_1.imv,
    shorthands_1.iv,
    new check_proof_insert_1.InvalidProofInsertWithBadNewConclusions((0, shorthands_1.app)((0, shorthands_1.imv)(-1), (0, shorthands_1.imv)(3)), [
        new check_proof_insert_1.FailedSubProblem((0, shorthands_1.imv)(-1), new sort_errors_1.FailedCheck(shorthands_1.type_k, shorthands_1.type_k, kind_s)),
        new check_proof_insert_1.FailedSubProblem((0, shorthands_1.imv)(3), new sort_errors_1.UndeclaredVariable(z))
    ])
]);
(0, run_test_1.run_test)(check_proof_insert_1.check_proof_insert, [
    "3 undefined (mvs corresponding to given new_conclusions don't appear in fragment)",
    (0, RecursiveMap_1.mk_map)(["a", shorthands_1.type_k], ["b", (0, shorthands_1.pi)(x, a, shorthands_1.type_k)]),
    (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["y", a]), a),
    [a, a, a],
    (m, v) => y,
    shorthands_1.imv,
    shorthands_1.iv,
    new check_proof_insert_1.ValidProofInsert(y, [], [])
]);
(0, run_test_1.run_test)(check_proof_insert_1.check_proof_insert, [
    "mixed",
    (0, RecursiveMap_1.mk_map)(["a", shorthands_1.type_k], ["b", (0, shorthands_1.pi)(x, a, shorthands_1.type_k)]),
    (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["y", a]), shorthands_1.type_k),
    [c, a, a],
    (m, v) => (0, shorthands_1.app)(m(0), m(1)),
    shorthands_1.imv,
    shorthands_1.iv,
    new check_proof_insert_1.InvalidProofInsertWithBadNewConclusions((0, shorthands_1.app)((0, shorthands_1.imv)(0), (0, shorthands_1.imv)(1)), [
        new check_proof_insert_1.FailedSubProblem((0, shorthands_1.imv)(0), new sort_errors_1.UndeclaredConstant(c)),
        new check_proof_insert_1.SubProblem((0, shorthands_1.imv)(1), (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(), a))
    ])
]);
(0, run_test_1.run_test)(check_proof_insert_1.check_proof_insert, [
    "indexed variable in ctx and ast (avoided redeclaration error)",
    (0, RecursiveMap_1.mk_map)(["a", shorthands_1.type_k], ["b", (0, shorthands_1.pi)(x, a, shorthands_1.type_k)]),
    (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["y", a], [(0, shorthands_1.iv)(0).id, shorthands_1.type_k]), (0, shorthands_1.pi)(x, a, shorthands_1.type_k)),
    [],
    (m, v) => (0, shorthands_1.la)(v(0), a, (0, shorthands_1.app)(b, y)),
    shorthands_1.imv,
    (i) => (0, shorthands_1.iv)(1 + i),
    new check_proof_insert_1.ValidProofInsert((0, shorthands_1.la)((0, shorthands_1.iv)(1), a, (0, shorthands_1.app)(b, y)), [(0, shorthands_1.iv)(1)], [])
]);
(0, run_test_1.run_test)(check_proof_insert_1.check_proof_insert, [
    "indexed variable in ctx and ast (with redeclaration error)",
    (0, RecursiveMap_1.mk_map)(["a", shorthands_1.type_k], ["b", (0, shorthands_1.pi)(x, a, shorthands_1.type_k)]),
    (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["y", a], [(0, shorthands_1.iv)(0).id, shorthands_1.type_k]), (0, shorthands_1.pi)(x, a, shorthands_1.type_k)),
    [],
    (m, v) => (0, shorthands_1.la)(v(0), a, (0, shorthands_1.app)(b, y)),
    shorthands_1.imv,
    shorthands_1.iv,
    new check_proof_insert_1.InvalidProofInsertWithBadFragment((0, shorthands_1.la)((0, shorthands_1.iv)(0), a, (0, shorthands_1.app)(b, y)), new sort_errors_1.BadChildSort((0, shorthands_1.la)((0, shorthands_1.iv)(0), a, (0, shorthands_1.app)(b, y)), new sort_errors_1.RedeclaredVariable((0, shorthands_1.iv)(0))))
]);
