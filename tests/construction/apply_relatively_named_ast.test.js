"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shorthands_1 = require("../../src/lambda_pi/shorthands");
const apply_relatively_named_ast_1 = require("../../src/construction/apply_relatively_named_ast");
const [X, Y, Z] = (0, shorthands_1.mvlist)("X", "Y", "Z");
const [x, y, z] = (0, shorthands_1.ovlist)("x", "y", "z");
const [a, b, c] = (0, shorthands_1.clist)("a", "b", "c");
const iov = (i) => (0, shorthands_1.gv)("", i);
const m0 = shorthands_1.imv;
const v0 = iov;
const m2 = (i) => (0, shorthands_1.imv)(i + 2);
const v2 = (i) => iov(i + 2);
const arna = apply_relatively_named_ast_1.applied_relatively_named_ast;
const apply_relatively_named_ast_tests = [
    // 0
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)((0, shorthands_1.pi)(y, x, z), shorthands_1.type_k)), m0, v0, arna((0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)((0, shorthands_1.pi)(y, x, z), shorthands_1.type_k)), [], []), "neither m nor v are called"],
    // 1
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)((0, shorthands_1.pi)(y, m(0), z), shorthands_1.type_k)), m0, v0, arna((0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)((0, shorthands_1.pi)(y, (0, shorthands_1.imv)(0), z), shorthands_1.type_k)), [(0, shorthands_1.imv)(0)], []), "m called once 0"],
    // 2
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)(m(4), shorthands_1.type_k)), m0, v0, arna((0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)((0, shorthands_1.imv)(4), shorthands_1.type_k)), [(0, shorthands_1.imv)(4)], []), "m called once +"],
    // 3
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)(m(-3), shorthands_1.type_k)), m0, v0, arna((0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)((0, shorthands_1.imv)(-3), shorthands_1.type_k)), [(0, shorthands_1.imv)(-3)], []), "m called once -"],
    // 4
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(x, m(0), m(8)), (0, shorthands_1.app)(m(-3), shorthands_1.type_k)), m0, v0, arna((0, shorthands_1.app)((0, shorthands_1.la)(x, (0, shorthands_1.imv)(0), (0, shorthands_1.imv)(8)), (0, shorthands_1.app)((0, shorthands_1.imv)(-3), shorthands_1.type_k)), [(0, shorthands_1.imv)(-3), (0, shorthands_1.imv)(0), (0, shorthands_1.imv)(8)], []), "m called > once"],
    // 5
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)((0, shorthands_1.pi)(y, v(0), z), shorthands_1.type_k)), m0, v0, arna((0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)((0, shorthands_1.pi)(y, iov(0), z), shorthands_1.type_k)), [], [iov(0)]), "v called once 0"],
    // 6
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)(v(4), shorthands_1.type_k)), m0, v0, arna((0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)(iov(4), shorthands_1.type_k)), [], [iov(4)]), "v called once +"],
    // 7
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)(v(-3), shorthands_1.type_k)), m0, v0, arna((0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)(iov(-3), shorthands_1.type_k)), [], [iov(-3)]), "v called once -"],
    // 8
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)(v(-3), shorthands_1.type_k)), m0, v0, arna((0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)(iov(-3), shorthands_1.type_k)), [], [iov(-3)]), "v called > once"],
    // 9
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(x, v(0), v(8)), (0, shorthands_1.app)(v(-3), shorthands_1.type_k)), m0, v0, arna((0, shorthands_1.app)((0, shorthands_1.la)(x, iov(0), iov(8)), (0, shorthands_1.app)(iov(-3), shorthands_1.type_k)), [], [iov(-3), iov(0), iov(8)]), "v called > once"],
    // 10
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.app)(X, (0, shorthands_1.app)(m(0), v(3))), (0, shorthands_1.app)(m(0), (0, shorthands_1.app)(v(9), m(-2)))), m0, v0, arna((0, shorthands_1.app)((0, shorthands_1.app)(X, (0, shorthands_1.app)((0, shorthands_1.imv)(0), iov(3))), (0, shorthands_1.app)((0, shorthands_1.imv)(0), (0, shorthands_1.app)(iov(9), (0, shorthands_1.imv)(-2)))), [(0, shorthands_1.imv)(-2), (0, shorthands_1.imv)(0)], [iov(3), iov(9)]), "mixed with m duplicate"],
    // 11
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.app)(X, (0, shorthands_1.app)(m(4), v(3))), (0, shorthands_1.app)(x, (0, shorthands_1.app)(v(3), m(-2)))), m0, v0, arna((0, shorthands_1.app)((0, shorthands_1.app)(X, (0, shorthands_1.app)((0, shorthands_1.imv)(4), iov(3))), (0, shorthands_1.app)(x, (0, shorthands_1.app)(iov(3), (0, shorthands_1.imv)(-2)))), [(0, shorthands_1.imv)(-2), (0, shorthands_1.imv)(4)], [iov(3)]), "mixed with v duplicate"],
    // 12
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)((0, shorthands_1.pi)(y, x, z), shorthands_1.type_k)), m2, v2, arna((0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)((0, shorthands_1.pi)(y, x, z), shorthands_1.type_k)), [], []), "neither m nor v are called 2"],
    // 13
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)((0, shorthands_1.pi)(y, m(0), z), shorthands_1.type_k)), m2, v2, arna((0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)((0, shorthands_1.pi)(y, (0, shorthands_1.imv)(2), z), shorthands_1.type_k)), [(0, shorthands_1.imv)(2)], []), "m called once 0 2"],
    // 14
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)(m(4), shorthands_1.type_k)), m2, v2, arna((0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)((0, shorthands_1.imv)(6), shorthands_1.type_k)), [(0, shorthands_1.imv)(6)], []), "m called once + 2"],
    // 15
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)(m(-3), shorthands_1.type_k)), m2, v2, arna((0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)((0, shorthands_1.imv)(-1), shorthands_1.type_k)), [(0, shorthands_1.imv)(-1)], []), "m called once - 2"],
    // 16
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(x, m(0), m(8)), (0, shorthands_1.app)(m(-3), shorthands_1.type_k)), m2, v2, arna((0, shorthands_1.app)((0, shorthands_1.la)(x, (0, shorthands_1.imv)(2), (0, shorthands_1.imv)(10)), (0, shorthands_1.app)((0, shorthands_1.imv)(-1), shorthands_1.type_k)), [(0, shorthands_1.imv)(-1), (0, shorthands_1.imv)(2), (0, shorthands_1.imv)(10)], []), "m called > once 2"],
    // 17
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)((0, shorthands_1.pi)(y, v(0), z), shorthands_1.type_k)), m2, v2, arna((0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)((0, shorthands_1.pi)(y, iov(2), z), shorthands_1.type_k)), [], [iov(2)]), "v called once 0 2"],
    // 18
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)(v(4), shorthands_1.type_k)), m2, v2, arna((0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)(iov(6), shorthands_1.type_k)), [], [iov(6)]), "v called once + 2"],
    // 19
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)(v(-3), shorthands_1.type_k)), m2, v2, arna((0, shorthands_1.app)((0, shorthands_1.la)(x, a, Y), (0, shorthands_1.app)(iov(-1), shorthands_1.type_k)), [], [iov(-1)]), "v called once - 2"],
    // 20
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(x, a, v(2)), (0, shorthands_1.app)(v(-3), shorthands_1.type_k)), m2, v2, arna((0, shorthands_1.app)((0, shorthands_1.la)(x, a, iov(4)), (0, shorthands_1.app)(iov(-1), shorthands_1.type_k)), [], [iov(-1), iov(4)]), "v called > once 2"],
    // 21
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.la)(x, v(0), v(8)), (0, shorthands_1.app)(v(-3), shorthands_1.type_k)), m2, v2, arna((0, shorthands_1.app)((0, shorthands_1.la)(x, iov(2), iov(10)), (0, shorthands_1.app)(iov(-1), shorthands_1.type_k)), [], [iov(-1), iov(2), iov(10)]), "v called > once 2"],
    // 22
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.app)(X, (0, shorthands_1.app)(m(0), v(3))), (0, shorthands_1.app)(m(0), (0, shorthands_1.app)(v(9), m(-2)))), m2, v2, arna((0, shorthands_1.app)((0, shorthands_1.app)(X, (0, shorthands_1.app)((0, shorthands_1.imv)(2), iov(5))), (0, shorthands_1.app)((0, shorthands_1.imv)(2), (0, shorthands_1.app)(iov(11), (0, shorthands_1.imv)(0)))), [(0, shorthands_1.imv)(0), (0, shorthands_1.imv)(2)], [iov(5), iov(11)]), "mixed with m duplicate 2"],
    // 23
    [(m, v) => (0, shorthands_1.app)((0, shorthands_1.app)(X, (0, shorthands_1.app)(m(4), v(3))), (0, shorthands_1.app)(x, (0, shorthands_1.app)(v(3), m(-2)))), m2, v2, arna((0, shorthands_1.app)((0, shorthands_1.app)(X, (0, shorthands_1.app)((0, shorthands_1.imv)(6), iov(5))), (0, shorthands_1.app)(x, (0, shorthands_1.app)(iov(5), (0, shorthands_1.imv)(0)))), [(0, shorthands_1.imv)(0), (0, shorthands_1.imv)(6)], [iov(5)]), "mixed with v duplicate 2"],
];
const run_apply_relatively_named_ast_case = (c) => (0, apply_relatively_named_ast_1.apply_relatively_named_ast)(c[0], c[1], c[2]);
for (const c of apply_relatively_named_ast_tests)
    test(`apply_relatively_named_ast ${c[4]}`, () => expect(run_apply_relatively_named_ast_case(c)).toEqual(c[3]));
