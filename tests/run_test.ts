import { isEqual } from "lodash"
import { compare } from "../src/compare"
import { declare, last } from "../src/utilities"

const partially_run_test = (f: any, test: any, equals: any = isEqual, stringify = (o: any) => JSON.stringify(o, null, 2)) =>
    declare(f(...test.slice(1, -1)), (actual) => declare(equals(actual, last(test)), (passed) =>
        passed ? "PASSED" : ({ actual: stringify(actual), expected: stringify(last(test)), diff: compare(actual, last(test)), passed })))

export const run_test = (f: any, t: any, equals: any = isEqual, stringify = (o: any): any => JSON.stringify(o, null, 2)) =>
    test(t[0], () => expect(partially_run_test(f, t, equals, stringify)).toEqual("PASSED"))


