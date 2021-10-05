"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shorthands_1 = require("../../src/lambda_pi/shorthands");
const utilities_1 = require("../utilities");
const pov_tests = [
    ["", (0, shorthands_1.ov)(""), (0, shorthands_1.ov)("")],
    ["simple", (0, shorthands_1.ov)("simple"), (0, shorthands_1.ov)("simple")],
    ["$", (0, shorthands_1.ov)("$"), (0, shorthands_1.ov)("$")],
    ["$_", (0, shorthands_1.ov)("$_"), (0, shorthands_1.ov)("$_")],
    ["$_cool", (0, shorthands_1.ov)("$_cool"), (0, shorthands_1.ov)("$_cool")],
    ["$something_else", (0, shorthands_1.ov)("$something_else"), (0, shorthands_1.ov)("$something_else")],
    ["$something_0", (0, shorthands_1.ov)("$something_0"), (0, shorthands_1.gv)("something", 0)],
    ["$else_-1", (0, shorthands_1.ov)("$else_-1"), (0, shorthands_1.gv)("else", -1)],
    ["something_2021", (0, shorthands_1.ov)("something_2021"), (0, shorthands_1.ov)("something_2021")],
    ["$something_2021", (0, shorthands_1.ov)("$something_2021"), (0, shorthands_1.gv)("something", 2021)],
    ["$something-2021", (0, shorthands_1.ov)("$something-2021"), (0, shorthands_1.ov)("$something-2021")],
    ["_2021", (0, shorthands_1.ov)("_2021"), (0, shorthands_1.ov)("_2021")],
    ["$_1", (0, shorthands_1.ov)("$_1"), (0, shorthands_1.iv)(1)],
    ["$_-1202", (0, shorthands_1.ov)("$_-1202"), (0, shorthands_1.iv)(-1202)],
];
const pov = (v) => v.parse();
test("variable parse", () => expect((0, utilities_1.run_tests)(pov, pov_tests)).toEqual([]));
const pmv_tests = [
    ["", (0, shorthands_1.mv)(""), (0, shorthands_1.mv)("")],
    ["simple", (0, shorthands_1.mv)("simple"), (0, shorthands_1.mv)("simple")],
    ["m", (0, shorthands_1.mv)("m"), (0, shorthands_1.mv)("m")],
    ["$cool_122", (0, shorthands_1.mv)("$cool_122"), (0, shorthands_1.mv)("$cool_122")],
    ["m_", (0, shorthands_1.mv)("m_"), (0, shorthands_1.mv)("m_")],
    ["m_cool", (0, shorthands_1.mv)("m_cool"), (0, shorthands_1.mv)("m_cool")],
    ["msomething_else", (0, shorthands_1.mv)("msomething_else"), (0, shorthands_1.mv)("msomething_else")],
    ["msomething_0", (0, shorthands_1.mv)("msomething_0"), (0, shorthands_1.mv)("msomething_0")],
    ["m_0", (0, shorthands_1.mv)("m_0"), (0, shorthands_1.imv)(0)],
    ["m_-12", (0, shorthands_1.mv)("m_-12"), (0, shorthands_1.imv)(-12)]
];
const pmv = (v) => v.parse();
test("meta variable parse", () => expect((0, utilities_1.run_tests)(pmv, pmv_tests)).toEqual([]));
