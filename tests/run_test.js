"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run_test = void 0;
const lodash_1 = require("lodash");
const compare_1 = require("../src/compare");
const utilities_1 = require("../src/utilities");
const partially_run_test = (f, test, equals = lodash_1.isEqual, stringify = (o) => JSON.stringify(o, null, 2)) => (0, utilities_1.declare)(f(...test.slice(1, -1)), (actual) => (0, utilities_1.declare)(equals(actual, (0, utilities_1.last)(test)), (passed) => passed ? "PASSED" : ({ actual: stringify(actual), expected: stringify((0, utilities_1.last)(test)), diff: (0, compare_1.compare)(actual, (0, utilities_1.last)(test)), passed })));
const run_test = (f, t, equals = lodash_1.isEqual, stringify = (o) => JSON.stringify(o, null, 2)) => test(t[0], () => expect(partially_run_test(f, t, equals, stringify)).toEqual("PASSED"));
exports.run_test = run_test;
