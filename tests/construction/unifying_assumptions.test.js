"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RecursiveMap_1 = require("../../src/map/RecursiveMap");
const unifying_assumptions_1 = require("../../src/construction/unifying_assumptions");
const shorthands_1 = require("../../src/lambda_pi/shorthands");
const utilities_1 = require("../utilities");
const [and, ml, o] = [(x, y) => (0, shorthands_1.flapp)((0, shorthands_1.con)("and"), x, y), (x) => (0, shorthands_1.app)((0, shorthands_1.con)("ml"), x), (0, shorthands_1.con)("o")];
const [A, B] = (0, shorthands_1.ovlist)("A", "B");
const [X, Y] = (0, shorthands_1.mvlist)("X", "Y");
// Write a bunch of find_unifying_assumptions tests where variable ids are properly parsed.
const find_unifying_assumptions_tests = [
    ["empty", (0, RecursiveMap_1.mk_map)(), ml(A), []],
    ["non-empty no match", (0, RecursiveMap_1.mk_map)(["cool", ml(B)]), shorthands_1.type_k, []],
    ["one element match", (0, RecursiveMap_1.mk_map)(["cool", ml(B)]), ml(X), [(0, unifying_assumptions_1.unifying_assumption)({ "X": B }, (0, shorthands_1.ov)("cool"))]],
    ["one element match parse", (0, RecursiveMap_1.mk_map)(["$_-12", ml(B)]), ml(X), [(0, unifying_assumptions_1.unifying_assumption)({ "X": B }, (0, shorthands_1.iv)(-12))]],
    [
        "5 elements 1 match some parsed",
        (0, RecursiveMap_1.mk_map)(["A", o], ["B", o], [(0, shorthands_1.iv)(0).id, ml(and(A, B))], ["c", ml(and(B, A))], [(0, shorthands_1.iv)(2).id, ml(and(B, B))]),
        ml(and(X, Y)),
        [(0, unifying_assumptions_1.unifying_assumption)({ "X": A, "Y": B }, (0, shorthands_1.iv)(0)), (0, unifying_assumptions_1.unifying_assumption)({ "X": B, "Y": A }, (0, shorthands_1.ov)("c")), (0, unifying_assumptions_1.unifying_assumption)({ "X": B, "Y": B }, (0, shorthands_1.iv)(2))]
    ]
];
test("unifying_assumptions", () => expect((0, utilities_1.run_tests)(unifying_assumptions_1.find_unifying_assumptions, find_unifying_assumptions_tests)).toEqual([]));
