import { isEqual } from "lodash"
import { CheckFiniteGeneratorAgainstArrayTest, check_finite_generator_against_array } from "./check_generator"

const check_finite_generator_against_array_tests: CheckFiniteGeneratorAgainstArrayTest[] = [
    {
        description: "empty gen and empty array",
        gen: (function* () {})(),
        exp: { yields: [] },
        output: []
    },
    {
        description: "empty gen and empty array unexpected returned",
        gen: (function* () { return -1202 })(),
        exp: { yields: [] },
        output: [{ exp_missing_returned: -1202 }]
    },
    {
        description: "empty gen and empty array unexpected threw",
        gen: (function* () { throw new Error("-1202") })(),
        exp: { yields: [] },
        output: [{ exp_missing_thrown: "-1202" }]
    },
    {
        description: "empty gen and empty array missing expected returned",
        gen: (function* () {})(),
        exp: { yields: [], returns: -1202 },
        output: [{ gen_missing_returned: -1202 }]
    },
    {
        description: "empty gen and empty array missing expected thrown",
        gen: (function* () {})(),
        exp: { yields: [], throws: "-1202" },
        output: [{ gen_missing_thrown: "-1202" }]
    },
    {
        description: "empty gen and empty array and returned",
        gen: (function* () { return 12 })(),
        exp: { yields: [], returns: 12 },
        output: [{ returned: 12 }]
    },
    {
        description: "empty gen and empty array and throws",
        gen: (function* () { throw new Error("12") })(),
        exp: { yields: [], throws: "12" },
        output: [{ thrown: "12" }]
    },
    {
        description: "empty gen and non-empty array",
        gen: (function* () {})(),
        exp: { yields: [{ yielded: 1 }, { yielded: 2 }, { yielded: 3 }] },
        output: [{ gen_missing: 1 }, { gen_missing: 2 }, { gen_missing: 3 }]
    },
    {
        description: "empty gen and non-empty array and returned",
        gen: (function* () { return -1 })(),
        exp: { yields: [{ yielded: 1 }, { yielded: 2 }, { yielded: 3 }] },
        output: [{ gen_missing: 1 }, { gen_missing: 2 }, { gen_missing: 3 }, { exp_missing_returned: -1 }]
    },
    {
        description: "empty gen and non-empty array and thrown",
        gen: (function* () { throw new Error("-1") })(),
        exp: { yields: [{ yielded: 1 }, { yielded: 2 }, { yielded: 3 }] },
        output: [{ gen_missing: 1 }, { gen_missing: 2 }, { gen_missing: 3 }, { exp_missing_thrown: "-1" }]
    },
    {
        description: "non-empty same",
        gen: (function* () { yield 1; yield 2; yield 3 })(),
        exp: { yields: [{ yielded: 1 }, { yielded: 2 }, { yielded: 3 }] },
        output: [{ same: 1 }, { same: 2 }, { same: 3 }]
    },
    {
        description: "non-empty same with returned",
        gen: (function* () { yield 1; yield 2; yield 3; return 10 })(),
        exp: { yields: [{ yielded: 1 }, { yielded: 2 }, { yielded: 3 }], returns: 10 },
        output: [{ same: 1 }, { same: 2 }, { same: 3 }, { returned: 10 }]
    },
    {
        description: "non-empty same with thrown",
        gen: (function* () { yield 1; yield 2; yield 3; throw new Error("10") })(),
        exp: { yields: [{ yielded: 1 }, { yielded: 2 }, { yielded: 3 }], throws: "10" },
        output: [{ same: 1 }, { same: 2 }, { same: 3 }, { thrown: "10" }]
    },
    {
        description: "different elements",
        gen: (function* () { yield 0; yield 2; yield 4 })(),
        exp: { yields: [{ yielded: 1 }, { yielded: 2 }, { yielded: 3 }] },
        output: [{ gen: 0, exp: 1 }, { same: 2 }, { gen: 4, exp: 3 }]
    },
    {
        description: "different elements and returned",
        gen: (function* () { yield 0; yield 2; yield 4; return 8 })(),
        exp: { yields: [{ yielded: 1 }, { yielded: 2 }, { yielded: 3 }], returns: 9 },
        output: [{ gen: 0, exp: 1 }, { same: 2 }, { gen: 4, exp: 3 }, { exp_returned: 9, gen_returned: 8 }]
    },
    {
        description: "different elements and thrown",
        gen: (function* () { yield 0; yield 2; yield 4; throw new Error("8") })(),
        exp: { yields: [{ yielded: 1 }, { yielded: 2 }, { yielded: 3 }], throws: "9" },
        output: [{ gen: 0, exp: 1 }, { same: 2 }, { gen: 4, exp: 3 }, { exp_thrown: "9", gen_thrown: "8" }]
    },
    {
        description: "non-empty gen and empty array",
        gen: (function* () { yield 1; yield 2; yield 3 })(),
        exp: { yields: [] },
        output: [{ exp_missing: 1 }, { exp_missing: 2 }, { exp_missing: 3 }]
    },
    {
        description: "non-empty gen with returned and empty array",
        gen: (function* () { yield 1; yield 2; yield 3; return 4 })(),
        exp: { yields: [] },
        output: [{ exp_missing: 1 }, { exp_missing: 2 }, { exp_missing: 3 }, { exp_missing_returned: 4 }]
    },
    {
        description: "non-empty gen with thrown and empty array",
        gen: (function* () { yield 1; yield 2; yield 3; throw new Error("4") })(),
        exp: { yields: [] },
        output: [{ exp_missing: 1 }, { exp_missing: 2 }, { exp_missing: 3 }, { exp_missing_thrown: "4" }]
    },
    {
        description: "same with next input",
        gen: (function* () { yield 1; const cool: any = yield 2; yield cool + 3 })(),
        exp: { yields: [{ yielded: 1 }, { yielded: 2, continued_with: 10 }, { yielded: 13 }] },
        output: [{ same: 1 }, { same: 2 }, { same: 13 }]
    },
    {
        description: "same with ignored next input",
        gen: (function* () { yield 1; yield 2; yield 3 })(),
        exp: { yields: [{ yielded: 1 }, { yielded: 2, continued_with: 10 }, { yielded: 3 }] },
        output: [{ same: 1 }, { same: 2 }, { same: 3 }]
    },
    {
        description: "difference after next input",
        gen: (function* () { yield 1; const cool: any = yield 4; yield cool + 3 })(),
        exp: { yields: [{ yielded: 1 }, { yielded: 4, continued_with: -2 }, { yielded: 2 }] },
        output: [{ same: 1 }, { same: 4 }, { gen: 1, exp: 2 }]
    },
    {
        description: "complex both non-empty with more gen",
        gen: (function* () { yield 2; const cool: any = yield 4; yield 10; yield 5 + cool })(),
        exp: { yields: [{ yielded: 1 }, { yielded: 4, continued_with: -2 }, { yielded: 1 }] },
        output: [{ gen: 2, exp: 1 }, { same: 4 }, { gen: 10, exp: 1 }, { exp_missing: 3 }]
    },
    {
        description: "complex both non-empty with more arr",
        gen: (function* () { yield 2; const cool = yield 4; yield 10 })(),
        exp: { yields: [{ yielded: 1 }, { yielded: 4, continued_with: -2 }, { yielded: 1 }, { yielded: 5 }] },
        output: [{ gen: 2, exp: 1 }, { same: 4 }, { gen: 10, exp: 1 }, { gen_missing: 5 }]
    },
    {
        description: "hits limit",
        limit: 6,
        gen: (function* () { for (let i = 1;; i++) yield i })(),
        exp: { yields: [{ yielded: 1 }, { yielded: 2 }, { yielded: 3 }] },
        output: [{ same: 1 }, { same: 2 }, { same: 3 }, { exp_missing: 4 }, { exp_missing: 5 }, { exp_missing: 6 }, { gen_at_limit: 7 }]
    },
]

test("check_finite_generator_against_array", () => expect(
    check_finite_generator_against_array_tests.map(({ description, gen, exp, output: expected, limit }) => {
        const actual = check_finite_generator_against_array(gen, exp, limit)
        if (!isEqual(expected, actual))
            return { result: "FAILED", description, expected, actual }
        return { result: "PASSED" }
    })
).toEqual(
    check_finite_generator_against_array_tests.map(({}) => ({ result: "PASSED" }))
))

