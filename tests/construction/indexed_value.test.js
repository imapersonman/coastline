"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const shorthands_1 = require("../../src/lambda_pi/shorthands");
const utilities_1 = require("../../src/lambda_pi/utilities");
const indexed_value_1 = require("../../src/construction/indexed_value");
const run_test_1 = require("../run_test");
const index_from_imv = (mv) => mv.index;
(0, run_test_1.run_test)((old_m, used_indices) => (0, indexed_value_1.make_indexed_value_avoiding_indices)(index_from_imv, old_m, used_indices)(0), [
    "starts with 0, no indices used",
    shorthands_1.imv,
    [],
    (0, shorthands_1.imv)(0)
], lodash_1.isEqual, utilities_1.ast_to_string);
(0, run_test_1.run_test)((old_m, used_indices) => (0, indexed_value_1.make_indexed_value_avoiding_indices)(index_from_imv, old_m, used_indices)(0), [
    "starts with 2, no indices used",
    (i) => (0, shorthands_1.imv)(i + 2),
    [],
    (0, shorthands_1.imv)(2)
]);
(0, run_test_1.run_test)((old_m, used_indices) => (0, indexed_value_1.make_indexed_value_avoiding_indices)(index_from_imv, old_m, used_indices)(0), [
    "starts with 2, one index used less than start",
    (i) => (0, shorthands_1.imv)(i + 2),
    [1],
    (0, shorthands_1.imv)(2)
]);
(0, run_test_1.run_test)((old_m, used_indices) => (0, indexed_value_1.make_indexed_value_avoiding_indices)(index_from_imv, old_m, used_indices)(0), [
    "starts with 2, one index used equal to start",
    (i) => (0, shorthands_1.imv)(i + 2),
    [2],
    (0, shorthands_1.imv)(5)
]);
(0, run_test_1.run_test)((old_m, used_indices) => (0, indexed_value_1.make_indexed_value_avoiding_indices)(index_from_imv, old_m, used_indices)(0), [
    "starts with 2, one index used greater than start",
    (i) => (0, shorthands_1.imv)(i + 2),
    [3],
    (0, shorthands_1.imv)(6)
]);
(0, run_test_1.run_test)((old_m, used_indices) => (0, indexed_value_1.make_indexed_value_avoiding_indices)(index_from_imv, old_m, used_indices)(0), [
    "starts with 3, largest index greater than start",
    (i) => (0, shorthands_1.imv)(i + 3),
    [0, -1, 13, 2, 4, 5, 3],
    (0, shorthands_1.imv)(17)
], lodash_1.isEqual, utilities_1.ast_to_string);
