import { isEqual } from "lodash";
import { IndexedMetaVariable } from "../../src/lambda_pi/ast";
import { imv } from "../../src/lambda_pi/shorthands";
import { ast_to_string } from "../../src/lambda_pi/utilities";
import { make_indexed_value_avoiding_indices } from "../../src/construction/indexed_value";
import { run_test } from "../run_test";

const index_from_imv = (mv: IndexedMetaVariable): number => mv.index

run_test((old_m: any, used_indices: any) => make_indexed_value_avoiding_indices(index_from_imv, old_m, used_indices)(0), [
    "starts with 0, no indices used",
    imv,
    [],
    imv(0)
], isEqual, ast_to_string)

run_test((old_m: any, used_indices: any) => make_indexed_value_avoiding_indices(index_from_imv, old_m, used_indices)(0), [
    "starts with 2, no indices used",
    (i: any) => imv(i + 2),
    [],
    imv(2)
])

run_test((old_m: any, used_indices: any) => make_indexed_value_avoiding_indices(index_from_imv, old_m, used_indices)(0), [
    "starts with 2, one index used less than start",
    (i: any) => imv(i + 2),
    [1],
    imv(2)
])

run_test((old_m: any, used_indices: any) => make_indexed_value_avoiding_indices(index_from_imv, old_m, used_indices)(0), [
    "starts with 2, one index used equal to start",
    (i: any) => imv(i + 2),
    [2],
    imv(5)
])

run_test((old_m: any, used_indices: any) => make_indexed_value_avoiding_indices(index_from_imv, old_m, used_indices)(0), [
    "starts with 2, one index used greater than start",
    (i: any) => imv(i + 2),
    [3],
    imv(6)
])

run_test((old_m: any, used_indices: any) => make_indexed_value_avoiding_indices(index_from_imv, old_m, used_indices)(0), [
    "starts with 3, largest index greater than start",
    (i: any) => imv(i + 3),
    [0, -1, 13, 2, 4, 5, 3],
    imv(17)
], isEqual, ast_to_string)