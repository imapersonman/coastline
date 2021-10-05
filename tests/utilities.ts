import { isEqual } from "lodash"
import { last } from "../src/utilities"

export const run_test = (f: (...args: any[]) => any, test: any[]) => [f(...test.slice(1, -1)), last(test)]

export const run_tests = (f: (...args: any[]) => any, tests: any[][], equal: (l: any, r: any) => boolean = isEqual) =>
    tests.map<[any[], number]>((test, index) => [test, index]).filter(([test,]) => !equal(run_test(f, test)[0], last(test))).map(([test, index]) => [test[0], index])