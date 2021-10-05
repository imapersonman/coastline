"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run_tests = exports.run_test = void 0;
const lodash_1 = require("lodash");
const utilities_1 = require("../src/utilities");
const run_test = (f, test) => [f(...test.slice(1, -1)), (0, utilities_1.last)(test)];
exports.run_test = run_test;
const run_tests = (f, tests, equal = lodash_1.isEqual) => tests.map((test, index) => [test, index]).filter(([test,]) => !equal((0, exports.run_test)(f, test)[0], (0, utilities_1.last)(test))).map(([test, index]) => [test[0], index]);
exports.run_tests = run_tests;
