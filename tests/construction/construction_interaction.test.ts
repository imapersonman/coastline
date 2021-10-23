import { isEmpty, isEqual } from "lodash";
import { check_proof_insert, ValidProofInsert, is_valid_proof_insert, SubProblem, sub_problem, InvalidProofInsert, valid_proof_insert } from "../../src/construction/check_proof_insert";
import { check_sequent, is_sequent_error, SequentError } from "../../src/construction/check_sequent";
import { sequent, Sequent } from "../../src/construction/sequent";
import { Tactic } from "../../src/construction/tactic";
import { is_tactic_error, TacticError, tactic_error } from "../../src/construction/tactic_error";
import { is_user_error, UserError, user_error } from "../../src/construction/user_error";
import { Request, is_request, request } from "../../src/construction/request"
import { VerifiedInteractionSpecification } from "../../src/construction/verified_interaction_specification";
import { Ast, GeneratedVariable, IndexedMetaVariable, Variable } from "../../src/lambda_pi/ast";
import { app, con, flapp, imv, iv, la, mvlist, ov, ovlist, pi } from "../../src/lambda_pi/shorthands";
import { Sig } from "../../src/logical_framework/sig";
import { mk_map } from "../../src/map/RecursiveMap";
import { defined } from "../../src/utilities";
import { maclogic_specification } from "../../src/construction/maclogic_verified_interaction";
import { insert, Insert } from "../../src/construction/insert";
import { RequestDefinition } from "../../src/construction/request_definition";
import { unifying_assumption } from "../../src/construction/unifying_assumptions";
import { emit_defined_or_undefined, get_user_selected_tactic_and_sub_problem, get_valid_main_problem_from_user, notify_user_about_error, notify_user_about_insert, run_interaction, run_response_interaction } from "../../src/construction/interaction";

type CheckedGeneratorEntry<Y, R> =
    | { gen: Y, exp: Y }
    | { gen_missing: Y }
    | { exp_missing: Y }
    | { same: Y }
    | { gen_returned: R, exp_returned: R }
    | { gen_missing_returned: R }
    | { exp_missing_returned: R }
    | { returned: R }
    // Can only throw strings.
    | { exp_thrown: string, gen_thrown: string }
    | { gen_missing_thrown: string }
    | { exp_missing_thrown: string }
    | { thrown: string }
    | { gen_at_limit: Y }

type GeneratorExpectationYield<Y, I> =
    | { yielded: Y, continued_with?: I }

type GeneratorExpectation<Y, R, I> = {
    yields: GeneratorExpectationYield<Y, I>[]
    returns?: R
    throws?: string
}

type CheckFiniteGeneratorAgainstArrayTest<Y = any, R = any, I = any> = {
    description: string,
    gen: Generator,
    exp: GeneratorExpectation<Y, R, I>,
    limit?: number,
    output: CheckedGeneratorEntry<Y, R>[]
}

// DO NOT pass an infinite generator into gen.
const check_finite_generator_against_array = <Y, R, I>(gen: Generator<Y, R>, exp: GeneratorExpectation<Y, R, I>, limit?: number): CheckedGeneratorEntry<Y, R>[] => {
    try {
        // the top line is the only one that can throw the caught exception.
        let it = gen.next()
        let index = 0
        let thrown: string | undefined = undefined
        const output: CheckedGeneratorEntry<Y, R>[] = []
        while (it.done === false) {
            if (defined(limit) && index >= limit) {
                output.push({ gen_at_limit: it.value })
                return output
            }
            // If exp finished first
            if (index >= exp.yields.length)
                output.push({ exp_missing: it.value })
            else if (isEqual(exp.yields[index].yielded, it.value))
                output.push({ same: it.value })
            else
                output.push({ gen: it.value, exp: exp.yields[index].yielded })
            try {
                if (index < exp.yields.length) {
                    const input = exp.yields[index].continued_with
                    if (index < exp.yields.length && defined(input))
                        it = gen.next(input)
                    else
                        it = gen.next()
                } else
                    it = gen.next()
            } catch (error) {
                thrown = (error as Error).message
                // output.push({ exp_missing_thrown: (error as Error).message })
                break
            } finally {
                index++
            }
        }
        // If gen finished first
        if (index < exp.yields.length) {
            for (let remaining_index = index; remaining_index < exp.yields.length; remaining_index++)
                output.push({ gen_missing: exp.yields[remaining_index].yielded })
        }

        if (defined(exp.returns) && defined(it.value))
            if (isEqual(exp.returns, it.value))
                output.push({ returned: it.value as R })
            else
                output.push({ exp_returned: exp.returns, gen_returned: it.value as R })
        else if (defined(exp.returns))
            output.push({ gen_missing_returned: exp.returns })
        else if (defined(it.value) && !defined(thrown) && !defined(exp.throws))
            output.push({ exp_missing_returned: it.value as R })
        else if (defined(exp.throws) && defined(thrown))
            if (isEqual(exp.throws, thrown))
                output.push({ thrown })
            else
                output.push({ exp_thrown: exp.throws, gen_thrown: thrown })
        else if (defined(exp.throws))
            output.push({ gen_missing_thrown: exp.throws })
        else if (defined(thrown))
            output.push({ exp_missing_thrown: thrown })
        
        return output
    } catch (error) {
        // Premises:
        // 1) The generator hasn't yielded anything.
        // 2) The generator hasn't returned anything.
        // 2) The generator has thrown.
        const thrown = (error as Error).message
        if (defined(exp.throws))
            if (isEqual(exp.throws, thrown))
                return [{ thrown }]
            else
                return [{ gen_thrown: thrown, exp_thrown: exp.throws }]
        const output: CheckedGeneratorEntry<Y, R>[] = []
        for (let remaining_index = 0; remaining_index < exp.yields.length; remaining_index++)
            output.push({ gen_missing: exp.yields[remaining_index].yielded })
        output.push({ exp_missing_thrown: thrown })
        return output
    }
}


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

const test_generator_expectation = <T = any, I = any, R = any>(name: string, generator: Generator<T, I, R>, expectation: GeneratorExpectation<T, I, R>) => {
    const actual = check_finite_generator_against_array(generator, expectation, 1000)
    const expected = [...expectation.yields.map(({ yielded }) => ({ same: yielded })), ...(defined(expectation.returns) ? [{ returned: expectation.returns }] : []), ...(defined(expectation.throws) ? [{ thrown: expectation.throws }] : [])]
    test(`${name}`, () => expect(actual).toEqual(expected)
    )
}

interface EmitEvent<Event> {
    user_gave_bad_main_problem: (mp: Sequent, mp_check: SequentError) => Event
    user_gave_main_problem: (mp: Sequent) => Event
    // yield emit_event.user_started_tactic(tactic_id, tactic, current_sub_problem)
    user_gave_bad_tactic: (tactic_id: string) => Event
    user_gave_tactic: (tactic_id: string, tactic: Tactic<any>) => Event
    user_gave_sub_problem: (sub_problem: SubProblem) => Event
    user_gave_bad_sub_problem: (sub_problem_id: string) => Event,
    started_tactic: (tactic_id: string, tactic: Tactic<any>, sub_problem: SubProblem) => Event
    user_messed_up: (user_error: UserError) => Event
    tactic_has_made_request: (request: Request<any>, transformed_parameter: any) => Event
    user_responded_to_request: (response: any, transformed_response: any) => Event
    finished_tactic: (valid_proof_insert: ValidProofInsert) => Event,
    finished_main_problem: (main_problem: Sequent) => Event
}

interface Expect<Expectation> {
    user_to_give_main_problem: () => Expectation
    user_to_give_tactic_or_sub_problem_id: () => Expectation
    user_to_respond_to_request: (request: Request<any>, transformed_parameter: any) => Expectation
}

// Every exception returns a string so that it can be passed into typescript's Error constructor.
interface Exceptions {
    tactic_error: (te: TacticError) => string
    invalid_user_error_id: (uid: string) => string
    invalid_user_error_payload: (ue: UserError) => string
    invalid_request_id: (rid: string) => string
    invalid_proof_insert: (ipi: InvalidProofInsert) => string
}

const default_expect: Expect<string> = {
    user_to_give_main_problem: () => "expect_user_to_give_main_problem",
    user_to_give_tactic_or_sub_problem_id: () => "expect_user_to_give_tactic_or_sub_problem_id",
    user_to_respond_to_request: (request, transformed_response) => "expect_user_to_respond_to_request"
}

const default_emit_event: EmitEvent<string> = {
    user_gave_bad_main_problem: (main_problem, main_problem_check) => "emit_event_user_gave_bad_main_problem",
    user_gave_main_problem: (main_problem) => "emit_event_user_gave_main_problem",
    user_gave_bad_tactic: (tactic_id) => "emit_event_user_gave_bad_tactic",
    user_gave_tactic: (id, tactic) => "emit_event_user_gave_tactic",
    user_gave_bad_sub_problem: (sub_problem_id) => "emit_event_user_gave_bad_sub_problem",
    user_gave_sub_problem: (sub_problem) => "emit_event_user_gave_sub_problem",
    started_tactic: (tactic_id, tactic, sub_problem) => "emit_event_started_tactic",
    user_messed_up: (user_error) => "emit_event_user_messed_up",
    tactic_has_made_request: (request, transformed_parameter) => "emit_event_tactic_has_made_request",
    user_responded_to_request: (response, transformed_response) => "emit_event_user_responded_to_request",
    finished_tactic: (valid_proof_insert) => "emit_event_finished_tactic",
    finished_main_problem: (main_problem) => "emit_event_finished_main_problem"
}

const default_exceptions: Exceptions = {
    tactic_error: (te: TacticError): string => `exceptions_tactic_error: ${te.message}`,
    invalid_user_error_id: (uid: string): string => `exceptions_invalid_user_error_id: ${uid}`,
    invalid_user_error_payload: (ue: UserError): string => `exceptions_invalid_user_error_payload: ${ue.id}`,
    invalid_request_id: (rid: string): string => `exceptions_invalid_request_id: ${rid}`,
    invalid_proof_insert: (ipi: InvalidProofInsert) => `exceptions_invalid_proof_insert`
}



const o = con("o")
const ml = (x: Ast): Ast => app(con("ml"), x)
const and = (x: Ast, y: Ast): Ast => flapp(con("and"), x, y)
const [A, B] =  ovlist("A", "B")
const [X, Y] = mvlist("X", "Y")

const test_simple_get_valid_main_problem_from_user = (name: string, interactions: GeneratorExpectation<any, any, any>) =>
    test_generator_expectation(
        `get_valid_main_problem_from_user ${name}`,
        get_valid_main_problem_from_user( maclogic_specification.sig, default_expect, default_emit_event),
        interactions)

test_simple_get_valid_main_problem_from_user("no bads", {
    yields: [
        { yielded: "expect_user_to_give_main_problem", continued_with: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(A)) },
        { yielded: "emit_event_user_gave_main_problem" }
    ],
    returns: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(A))
})

test_simple_get_valid_main_problem_from_user("one bad", {
    yields: [
        { yielded: "expect_user_to_give_main_problem", continued_with: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(B)) },
        { yielded: "emit_event_user_gave_bad_main_problem" },
        { yielded: "expect_user_to_give_main_problem", continued_with: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(A)) },
        { yielded: "emit_event_user_gave_main_problem" }
    ],
    returns: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(A))
})

test_simple_get_valid_main_problem_from_user("three bad", {
    yields: [
        { yielded: "expect_user_to_give_main_problem", continued_with: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(B)) },
        { yielded: "emit_event_user_gave_bad_main_problem" },
        { yielded: "expect_user_to_give_main_problem", continued_with: sequent(mk_map(["A", o], ["$_0", ml(B)]), ml(A)) },
        { yielded: "emit_event_user_gave_bad_main_problem" },
        { yielded: "expect_user_to_give_main_problem", continued_with: sequent(mk_map(["A", o], ["A", o], ["$_0", ml(A)]), ml(A)) },
        { yielded: "emit_event_user_gave_bad_main_problem" },
        { yielded: "expect_user_to_give_main_problem", continued_with: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(A)) },
        { yielded: "emit_event_user_gave_main_problem" }
    ],
    returns: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(A))
})


const emit_defined = (variant) => (v) => `${variant}: value at key ${v} is defined`
const emit_undefined = (variant) => (v) => `${variant}: value at key ${v} is undefined`

test_generator_expectation(
    "emit_defined_or_undefined: variant 1, empty, undefined, 'cool'",
    emit_defined_or_undefined<string, string>({}, "cool", emit_defined(1), emit_undefined(1)),
    { yields: [{ yielded: "1: value at key cool is undefined" }], returns: undefined }
)

test_generator_expectation(
    "emit_defined_or_undefined: variant 2, nonempty, undefined, 'cool'",
    emit_defined_or_undefined<string, string>({ "something": "else", "happened": "here" }, "cool", emit_defined(2), emit_undefined(2)),
    { yields: [{ yielded: "2: value at key cool is undefined" }], returns: undefined }
)

test_generator_expectation(
    "emit_defined_or_undefined: variant 1, nonempty, undefined, 'beans'",
    emit_defined_or_undefined<string, string>({ "something": "else", "happened": "here" }, "beans", emit_defined(1), emit_undefined(1)),
    { yields: [{ yielded: "1: value at key beans is undefined" }], returns: undefined }
)

test_generator_expectation(
    "emit_defined_or_undefined: variant 2, nonempty, defined, 'cool'",
    emit_defined_or_undefined<string, string>({ "something": "else", "cool": "happened", "here": "nice" }, "cool", emit_defined(2), emit_defined(2)),
    { yields: [{ yielded: "2: value at key cool is defined" }], returns: "happened" }
)

test_generator_expectation(
    "emit_defined_or_undefined: variant 1, nonempty, defined, 'here'",
    emit_defined_or_undefined<string, string>({ "something": "else", "cool": "happened", "here": "nice" }, "here", emit_defined(1), emit_defined(1)),
    { yields: [{ yielded: "1: value at key here is defined" }], returns: "nice" }
)

const sub_problems_example_1 = {
    0: sub_problem(imv(0), sequent(mk_map<Ast>(["A", o], ["$_0", ml(A)]), ml(A)))
}
const sub_problems_example_2 = {
    0: sub_problem(imv(0), sequent(mk_map<Ast>(["A", o], ["$_0", ml(A)]), ml(A))),
    1: sub_problem(imv(1), sequent(mk_map<Ast>(["A", o], ["B", o], ["$_1", ml(A)], ["$_2", ml(B)]), ml(B)))
}
const sub_problems_example_3 = {
    3: sub_problem(imv(3), sequent(mk_map<Ast>(["A", o], ["$_0", ml(A)]), ml(A))),
    4: sub_problem(imv(4), sequent(mk_map<Ast>(["A", o], ["B", o], ["$_1", ml(A)], ["$_2", ml(B)]), ml(B))),
    5: sub_problem(imv(5), sequent(mk_map<Ast>(["A", o], ["B", o], ["$_1", ml(A)], ["$_2", ml(B)]), ml(A)))
}

test_generator_expectation("get_user_selected_tactic_and_sub_problem: no bads, sub_problem_id first",
    get_user_selected_tactic_and_sub_problem(maclogic_specification.tactics, sub_problems_example_1, default_emit_event, default_expect),
    {
        yields: [
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 0 } },
            { yielded: "emit_event_user_gave_sub_problem" },
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "ande" } },
            { yielded: "emit_event_user_gave_tactic" },
        ],
        returns: ["ande", maclogic_specification.tactics["ande"], 0, sub_problems_example_1[0]]
    }
)

test_generator_expectation("get_user_selected_tactic_and_sub_problem: no bads, sub_problem_id first, reset sub_problem",
    get_user_selected_tactic_and_sub_problem(maclogic_specification.tactics, sub_problems_example_2, default_emit_event, default_expect),
    {
        yields: [
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 0 } },
            { yielded: "emit_event_user_gave_sub_problem" },
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 1 } },
            { yielded: "emit_event_user_gave_sub_problem" },
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "ande" } },
            { yielded: "emit_event_user_gave_tactic" },
        ],
        returns: ["ande", maclogic_specification.tactics["ande"], 1, sub_problems_example_2[1]]
    }
)

test_generator_expectation("get_user_selected_tactic_and_sub_problem: no bads, tactic_id first",
    get_user_selected_tactic_and_sub_problem(maclogic_specification.tactics, sub_problems_example_2, default_emit_event, default_expect),
    {
        yields: [
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "close" } },
            { yielded: "emit_event_user_gave_tactic" },
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 1 } },
            { yielded: "emit_event_user_gave_sub_problem" }
        ],
        returns: ["close", maclogic_specification.tactics["close"], 1, sub_problems_example_2[1]]
    }
)

test_generator_expectation("get_user_selected_tactic_and_sub_problem: no bads, tactic_id first, reset tactic_id",
    get_user_selected_tactic_and_sub_problem(maclogic_specification.tactics, sub_problems_example_2, default_emit_event, default_expect),
    {
        yields: [
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "close" } },
            { yielded: "emit_event_user_gave_tactic" },
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "ande" } },
            { yielded: "emit_event_user_gave_tactic" },
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 1 } },
            { yielded: "emit_event_user_gave_sub_problem" },
        ],
        returns: ["ande", maclogic_specification.tactics["ande"], 1, sub_problems_example_2[1]]
    }
)

test_generator_expectation("get_user_selected_tactic_and_sub_problem: one bad tactic, sub_problem_id first",
    get_user_selected_tactic_and_sub_problem(maclogic_specification.tactics, sub_problems_example_3, default_emit_event, default_expect),
    {
        yields: [
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "beans" } },
            { yielded: "emit_event_user_gave_bad_tactic" },
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 3 } },
            { yielded: "emit_event_user_gave_sub_problem" },
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "close" } },
            { yielded: "emit_event_user_gave_tactic" }
        ],
        returns: ["close", maclogic_specification.tactics["close"], 3, sub_problems_example_3[3]]
    },
)

test_generator_expectation("get_user_selected_tactic_and_sub_problem: one bad sub_problem, tactic_id first",
    get_user_selected_tactic_and_sub_problem(maclogic_specification.tactics, sub_problems_example_3, default_emit_event, default_expect),
    {
        yields: [
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "andi" } },
            { yielded: "emit_event_user_gave_tactic" },
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 0 } },
            { yielded: "emit_event_user_gave_bad_sub_problem" },
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 4 } },
            { yielded: "emit_event_user_gave_sub_problem" }
        ],
        returns: ["andi", maclogic_specification.tactics["andi"], 4, sub_problems_example_3[4]]
    },
)

test_generator_expectation("get_user_selected_tactic_and_sub_problem: a bunch of random bads",
    get_user_selected_tactic_and_sub_problem(maclogic_specification.tactics, sub_problems_example_3, default_emit_event, default_expect),
    {
        yields: [
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "uhhhhh" } },
            { yielded: "emit_event_user_gave_bad_tactic" },
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "idk" } },
            { yielded: "emit_event_user_gave_bad_tactic" },
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: -1 } },
            { yielded: "emit_event_user_gave_bad_sub_problem" },
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "oino!" } },
            { yielded: "emit_event_user_gave_bad_tactic" },
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 6 } },
            { yielded: "emit_event_user_gave_bad_sub_problem" },
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "andi" } },
            { yielded: "emit_event_user_gave_tactic" },
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 0 } },
            { yielded: "emit_event_user_gave_bad_sub_problem" },
            { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 4 } },
            { yielded: "emit_event_user_gave_sub_problem" }
        ],
        returns: ["andi", maclogic_specification.tactics["andi"], 4, sub_problems_example_3[4]]
    },
)

test_generator_expectation("can't find user_error_id 'cookies'",
    notify_user_about_error(maclogic_specification.errors, user_error("cookies", 1), default_emit_event, default_exceptions),
    {
        yields: [],
        throws: "exceptions_invalid_user_error_id: cookies"
    }
)

test_generator_expectation("can't find user_error_id 'chips'",
    notify_user_about_error(maclogic_specification.errors, user_error("chips", -1), default_emit_event, default_exceptions),
    {
        yields: [],
        throws: "exceptions_invalid_user_error_id: chips"
    }
)

test_generator_expectation("not_a_string payload is a string",
    notify_user_about_error(maclogic_specification.errors, user_error("not_a_string", "is_a_string"), default_emit_event, default_exceptions),
    {
        yields: [],
        throws: "exceptions_invalid_user_error_payload: not_a_string"
    }
)

test_generator_expectation("not_an_integer payload is an integer",
    notify_user_about_error(maclogic_specification.errors, user_error("not_an_integer", 0), default_emit_event, default_exceptions),
    {
        yields: [],
        throws: "exceptions_invalid_user_error_payload: not_an_integer"
    }
)

test_generator_expectation("not_a_string success",
    notify_user_about_error(maclogic_specification.errors, user_error("not_a_string", 0), default_emit_event, default_exceptions),
    {
        yields: [{ yielded: "emit_event_user_messed_up" }]
    }
)

test_generator_expectation("not_an_integer success",
    notify_user_about_error(maclogic_specification.errors, user_error("not_an_integer", "bun"), default_emit_event, default_exceptions),
    {
        yields: [{ yielded: "emit_event_user_messed_up" }]
    }
)

test_generator_expectation(
    "success in used_variable responding with 'a'",
    run_response_interaction(
        request("used_variable", mk_map(["a", ml(and(A, B))], ["b", ml(and(B, A))])),
        mk_map(["a", ml(and(A, B))], ["b", ml(and(B, A))]),
        maclogic_specification.requests["used_variable"].response,
        maclogic_specification.errors,
        default_emit_event,
        default_expect,
        default_exceptions
    ),
    {
        yields: [
            { yielded: "emit_event_tactic_has_made_request" },
            { yielded: "expect_user_to_respond_to_request", continued_with: "a" }
        ],
        returns: ['a', ov('a')]
    }
)

test_generator_expectation(
    "success in used_variable responding with 'b'",
    run_response_interaction(
        request("used_variable", mk_map(["a", ml(and(A, B))], ["b", ml(and(B, A))])),
        mk_map(["a", ml(and(A, B))], ["b", ml(and(B, A))]),
        maclogic_specification.requests["used_variable"].response,
        maclogic_specification.errors,
        default_emit_event,
        default_expect,
        default_exceptions
    ),
    {
        yields: [
            { yielded: "emit_event_tactic_has_made_request" },
            { yielded: "expect_user_to_respond_to_request", continued_with: "b" }
        ],
        returns: ['b', ov('b')]
    }
)

test_generator_expectation(
    "failures in used_variable responding with 0, then 'c', then 'b'",
    run_response_interaction(
        request("used_variable", mk_map(["a", ml(and(A, B))], ["b", ml(and(B, A))])),
        mk_map(["a", ml(and(A, B))], ["b", ml(and(B, A))]),
        maclogic_specification.requests["used_variable"].response,
        maclogic_specification.errors,
        default_emit_event,
        default_expect,
        default_exceptions
    ),
    {
        yields: [
            { yielded: "emit_event_tactic_has_made_request" },
            { yielded: "expect_user_to_respond_to_request", continued_with: 0 },
            { yielded: "emit_event_user_messed_up" },
            { yielded: "expect_user_to_respond_to_request", continued_with: "c" },
            { yielded: "emit_event_user_messed_up" },
            { yielded: "expect_user_to_respond_to_request", continued_with: "b" }
        ],
        returns: ['b', ov('b')]
    }
)

test_generator_expectation(
    "is valid",
    notify_user_about_insert(
        maclogic_specification.sig,
        sequent(mk_map(["A", o], ["a", ml(A)]), ml(A)),
        insert([], (m, v) => ov("a")),
        imv,
        iv,
        default_emit_event,
        default_exceptions
    ),
    { yields: [{ yielded: "emit_event_finished_tactic" }], returns: valid_proof_insert(ov("a"), [], []) }
)

test_generator_expectation(
    "is invalid",
    notify_user_about_insert(
        maclogic_specification.sig,
        sequent(mk_map(["A", o], ["a", ml(A)]), ml(A)),
        insert([], (m, v) => ov("b")),
        imv,
        iv,
        default_emit_event,
        default_exceptions
    ),
    { yields: [], throws: "exceptions_invalid_proof_insert" }
)

const test_simple_interaction = (name: string, spec: VerifiedInteractionSpecification, interaction: GeneratorExpectation<any, any, any>): void =>
    test_generator_expectation(
        `run_interaction ${name}`,
        run_interaction(
            spec,
            default_expect,
            default_emit_event,
            default_exceptions
        ),
        interaction
    )

test_simple_interaction("simple_single_close_sub_problem_first", maclogic_specification, {
    yields: [
        { yielded: "expect_user_to_give_main_problem", continued_with: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(A)) },
        { yielded: "emit_event_user_gave_main_problem" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 0 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "close" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_finished_tactic" },
        { yielded: "emit_event_finished_main_problem" }
    ]
})

test_simple_interaction("simple_single_close_tactic_first", maclogic_specification, {
    yields: [
        { yielded: "expect_user_to_give_main_problem", continued_with: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(A)) },
        { yielded: "emit_event_user_gave_main_problem" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "close" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 0 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_finished_tactic" },
        { yielded: "emit_event_finished_main_problem" }
    ]
})

test_simple_interaction("simple_andi_close_close", maclogic_specification, {
    yields: [
        { yielded: "expect_user_to_give_main_problem", continued_with: sequent(mk_map(["A", o], ["B", o], ["a", ml(A)], ["b", ml(B)]), ml(and(A, B))) },
        { yielded: "emit_event_user_gave_main_problem" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "andi" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 0 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_finished_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "close" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 1 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_finished_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "close" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 2 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_finished_tactic" },
        { yielded: "emit_event_finished_main_problem" }
    ],
})

test_simple_interaction("simple_ande_close_with_request", maclogic_specification, {
    yields: [
        { yielded: "expect_user_to_give_main_problem", continued_with: sequent(mk_map(["A", o], ["B", o], ["a", ml(and(A, B))]), ml(B)) },
        { yielded: "emit_event_user_gave_main_problem" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "ande" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 0 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },

        { yielded: "emit_event_tactic_has_made_request" },
        { yielded: "expect_user_to_respond_to_request", continued_with: 0 },
        { yielded: "emit_event_user_responded_to_request" },

        { yielded: "emit_event_finished_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "close" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 1 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_finished_tactic" },
        { yielded: "emit_event_finished_main_problem" }
    ]
})

test_simple_interaction("simple_ande_close_with_request", maclogic_specification, {
    yields: [
        { yielded: "expect_user_to_give_main_problem", continued_with: sequent(mk_map(["A", o], ["B", o], ["a", ml(and(A, B))]), ml(B)) },
        { yielded: "emit_event_user_gave_main_problem" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "ande" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 0 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },

        { yielded: "emit_event_tactic_has_made_request" },
        { yielded: "expect_user_to_respond_to_request", continued_with: 0 },
        { yielded: "emit_event_user_responded_to_request" },

        { yielded: "emit_event_finished_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "close" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 1 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_finished_tactic" },
        { yielded: "emit_event_finished_main_problem" }
    ]
})

const x = ov("x")
const i = con("i")
const exists = (v: Variable, b: Ast): Ast => app(con("exists"), la(x, i, b))
const F1 = (x: Ast): Ast => app(ov("F"), x)
const G1 = (x: Ast): Ast => app(ov("G"), x)
test_simple_interaction("simple_multiple_requests", maclogic_specification, {
    yields: [
        { yielded: "expect_user_to_give_main_problem", continued_with: sequent(mk_map(["A", o], ["B", o], ["F", pi(x, i, o)], ["G", pi(x, i, o)], ["a", ml(exists(x, and(F1(x), G1(x))))]), ml(exists(x, F1(x)))) },
        { yielded: "emit_event_user_gave_main_problem" },

        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "existse" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 0 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_tactic_has_made_request" },
        { yielded: "expect_user_to_respond_to_request", continued_with: 0 },
        { yielded: "emit_event_user_responded_to_request" },
        { yielded: "emit_event_tactic_has_made_request" },
        { yielded: "expect_user_to_respond_to_request", continued_with: "c" },
        { yielded: "emit_event_user_responded_to_request" },
        { yielded: "emit_event_finished_tactic" },

        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "existsi" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 1 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_tactic_has_made_request" },
        { yielded: "expect_user_to_respond_to_request", continued_with: "c" },
        { yielded: "emit_event_user_responded_to_request" },
        { yielded: "emit_event_finished_tactic" },

        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "ande" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 2 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_tactic_has_made_request" },
        { yielded: "expect_user_to_respond_to_request", continued_with: 0 },
        { yielded: "emit_event_user_responded_to_request" },
        { yielded: "emit_event_finished_tactic" },

        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "close" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 3 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_finished_tactic" },

        { yielded: "emit_event_finished_main_problem" }
    ]
})

test_simple_interaction("simple_two_bad_main_problems_single_close_tactic_first", maclogic_specification, {
    yields: [
        { yielded: "expect_user_to_give_main_problem", continued_with: sequent(mk_map(["A", o], ["$_0", ml(B)]), ml(A)) },
        { yielded: "emit_event_user_gave_bad_main_problem" },
        { yielded: "expect_user_to_give_main_problem", continued_with: sequent(mk_map(["A", o], ["$_0", ml(B)]), ml(A)) },
        { yielded: "emit_event_user_gave_bad_main_problem" },
        { yielded: "expect_user_to_give_main_problem", continued_with: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(A)) },
        { yielded: "emit_event_user_gave_main_problem" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 0 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "close" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_finished_tactic" },
        { yielded: "emit_event_finished_main_problem" }
    ]
})


test_simple_interaction("simple_single_close_tactic_first_with_tactic_error_on_first", { ...maclogic_specification, tactics: { "bad": function* () { return tactic_error("invoked a bad error STOP") } } }, {
    yields: [
        { yielded: "expect_user_to_give_main_problem", continued_with: sequent(mk_map(["A", o]), ml(A)) },
        { yielded: "emit_event_user_gave_main_problem" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "bad" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 0 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" }
    ],
    throws: "exceptions_tactic_error: invoked a bad error STOP"
})

test_simple_interaction("simple_single_close_tactic_first_with_tactic_error_on_second", { ...maclogic_specification, tactics: { ...maclogic_specification.tactics, "bad": function* () { return tactic_error("invoked a bad error STOP") } } }, {
    yields: [
        { yielded: "expect_user_to_give_main_problem", continued_with: sequent(mk_map(["A", o], ["B", o]), ml(and(A, B))) },
        { yielded: "emit_event_user_gave_main_problem" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "andi" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 0 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_finished_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "bad" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 1 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" }
    ],
    throws: "exceptions_tactic_error: invoked a bad error STOP"
})

test_simple_interaction("simple_single_close_tactic_first_with_user_error_on_first", maclogic_specification, {
    yields: [
        { yielded: "expect_user_to_give_main_problem", continued_with: sequent(mk_map(["A", o], ["B", o], ["a", ml(A)], ["b", ml(B)]), ml(and(A, B))) },
        { yielded: "emit_event_user_gave_main_problem" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "close" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 0 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_user_messed_up" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "andi" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 0 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_finished_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "close" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 1 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_finished_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "close" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 2 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_finished_tactic" },
        { yielded: "emit_event_finished_main_problem" }
    ],
})

test_simple_interaction("simple_single_close_tactic_first_with_user_error_on_first", maclogic_specification, {
    yields: [
        { yielded: "expect_user_to_give_main_problem", continued_with: sequent(mk_map(["A", o], ["B", o], ["a", ml(A)], ["b", ml(B)]), ml(and(A, B))) },
        { yielded: "emit_event_user_gave_main_problem" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "andi" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 0 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_finished_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "andi" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 1 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_user_messed_up" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "close" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 1 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_finished_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "TacticId", value: "close" } },
        { yielded: "emit_event_user_gave_tactic" },
        { yielded: "expect_user_to_give_tactic_or_sub_problem_id", continued_with: { type: "SubProblemId", value: 2 } },
        { yielded: "emit_event_user_gave_sub_problem" },
        { yielded: "emit_event_started_tactic" },
        { yielded: "emit_event_finished_tactic" },
        { yielded: "emit_event_finished_main_problem" }
    ],
})
