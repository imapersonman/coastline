"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.next_indexed_variable_tests = void 0;
const shorthands_1 = require("../../src/lambda_pi/shorthands");
const next_indexed_variable_1 = require("../../src/lambda_pi/next_indexed_variable");
const utilities_1 = require("../utilities");
exports.next_indexed_variable_tests = [
    ["Type", shorthands_1.type_k, (0, shorthands_1.iv)(0)],
    ["constant", (0, shorthands_1.con)("a"), (0, shorthands_1.iv)(0)],
    ["variable", (0, shorthands_1.ov)("b"), (0, shorthands_1.iv)(0)],
    ["indexed variable 10", (0, shorthands_1.iv)(10), (0, shorthands_1.iv)(11)],
    ["indexed variable -11", (0, shorthands_1.iv)(-11), (0, shorthands_1.iv)(-10)],
    ["indexed variable -1", (0, shorthands_1.iv)(-1), (0, shorthands_1.iv)(0)],
    ["generated variable 11", (0, shorthands_1.gv)("cool", 11), (0, shorthands_1.iv)(0)],
    ["app none", (0, shorthands_1.app)((0, shorthands_1.con)("some"), (0, shorthands_1.ov)("thing")), (0, shorthands_1.iv)(0)],
    ["app some", (0, shorthands_1.app)((0, shorthands_1.con)("else"), (0, shorthands_1.iv)(31)), (0, shorthands_1.iv)(32)],
    ["deep app compare", (0, shorthands_1.app)((0, shorthands_1.app)((0, shorthands_1.con)("some"), (0, shorthands_1.iv)(-12)), (0, shorthands_1.app)((0, shorthands_1.iv)(12), (0, shorthands_1.con)("some"))), (0, shorthands_1.iv)(13)],
    ["la none", (0, shorthands_1.la)((0, shorthands_1.ov)("x"), shorthands_1.type_k, (0, shorthands_1.con)("y")), (0, shorthands_1.iv)(0)],
    ["la some", (0, shorthands_1.la)((0, shorthands_1.ov)("y"), (0, shorthands_1.iv)(31), shorthands_1.type_k), (0, shorthands_1.iv)(32)],
    ["la bound compare", (0, shorthands_1.la)((0, shorthands_1.iv)(31), (0, shorthands_1.ov)("a"), (0, shorthands_1.iv)(9)), (0, shorthands_1.iv)(32)],
    ["deep la compare", (0, shorthands_1.la)((0, shorthands_1.ov)("k"), (0, shorthands_1.la)((0, shorthands_1.iv)(-7), shorthands_1.type_k, shorthands_1.type_k), (0, shorthands_1.la)((0, shorthands_1.ov)("k"), (0, shorthands_1.iv)(-14), shorthands_1.type_k)), (0, shorthands_1.iv)(0)],
    ["pi none", (0, shorthands_1.pi)((0, shorthands_1.ov)("x"), shorthands_1.type_k, (0, shorthands_1.con)("y")), (0, shorthands_1.iv)(0)],
    ["pi some", (0, shorthands_1.pi)((0, shorthands_1.ov)("y"), (0, shorthands_1.iv)(31), shorthands_1.type_k), (0, shorthands_1.iv)(32)],
    ["pi bound compare", (0, shorthands_1.pi)((0, shorthands_1.iv)(31), (0, shorthands_1.ov)("a"), (0, shorthands_1.iv)(9)), (0, shorthands_1.iv)(32)],
    ["deep pi compare", (0, shorthands_1.pi)((0, shorthands_1.iv)(-16), (0, shorthands_1.pi)((0, shorthands_1.iv)(-14), shorthands_1.type_k, shorthands_1.type_k), (0, shorthands_1.pi)((0, shorthands_1.ov)("nah"), (0, shorthands_1.iv)(2), shorthands_1.type_k)), (0, shorthands_1.iv)(3)]
];
test("next_indexed_variable", () => expect((0, utilities_1.run_tests)(next_indexed_variable_1.next_indexed_variable, exports.next_indexed_variable_tests)).toEqual([]));
