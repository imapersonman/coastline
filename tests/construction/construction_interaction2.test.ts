import { sub_problem, InvalidProofInsert, valid_proof_insert } from "../../src/construction/check_proof_insert";
import { sequent } from "../../src/construction/sequent";
import { TacticError, tactic_error } from "../../src/construction/tactic_error";
import { UserError, user_error } from "../../src/construction/user_error";
import { request } from "../../src/construction/request"
import { VerifiedInteractionSpecification } from "../../src/construction/verified_interaction_specification";
import { Ast, Variable } from "../../src/lambda_pi/ast";
import { app, con, flapp, imv, iv, la, mvlist, ov, ovlist, pi } from "../../src/lambda_pi/shorthands";
import { mk_map } from "../../src/map/RecursiveMap";
import { defined } from "../../src/utilities";
import { maclogic_specification } from "../../src/construction/maclogic_verified_interaction";
import { insert } from "../../src/construction/insert";
import { emit_defined_or_undefined, get_user_selected_tactic_and_sub_problem, get_valid_main_problem_from_user, notify_user_about_error, notify_user_about_insert, mk_run_interaction, run_response_interaction, Expect, EmitEvent, Exceptions } from "../../src/construction/interaction";
import { check_finite_generator_against_array, GeneratorExpectation } from "./check_generator";

const test_generator_expectation = <T = any, I = any, R = any>(name: string, generator: Generator<T, I, R>, expectation: GeneratorExpectation<T, I, R>) => {
    const actual = check_finite_generator_against_array(generator, expectation, 1000)
    const expected = [...expectation.yields.map(({ yielded }) => ({ same: yielded })), ...(defined(expectation.returns) ? [{ returned: expectation.returns }] : []), ...(defined(expectation.throws) ? [{ thrown: expectation.throws }] : [])]
    test(`${name}`, () => expect(actual).toEqual(expected))
}

const test_expect: Expect<string> = {
    user_to_give_main_problem: () => "expect_user_to_give_main_problem",
    user_to_give_tactic_or_sub_problem_id: () => "expect_user_to_give_tactic_or_sub_problem_id",
    user_to_respond_to_request: (request, transformed_response) => "expect_user_to_respond_to_request"
}

const test_emit: EmitEvent<string> = {
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
        get_valid_main_problem_from_user( maclogic_specification.sig, test_expect, test_emit),
        interactions)

test_simple_get_valid_main_problem_from_user("no bads", {
    yields: [
        { yielded: "expect_user_to_give_main_problem", continued_with: { type: "MainProblem", value: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(A)) } },
        { yielded: "emit_event_user_gave_main_problem" }
    ],
    returns: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(A))
})

test_simple_get_valid_main_problem_from_user("one bad", {
    yields: [
        { yielded: "expect_user_to_give_main_problem", continued_with: { type: "MainProblem", value: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(B)) } },
        { yielded: "emit_event_user_gave_bad_main_problem" },
        { yielded: "expect_user_to_give_main_problem", continued_with: { type: "MainProblem", value: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(A)) } },
        { yielded: "emit_event_user_gave_main_problem" }
    ],
    returns: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(A))
})

test_simple_get_valid_main_problem_from_user("three bad", {
    yields: [
        { yielded: "expect_user_to_give_main_problem", continued_with: { type: "MainProblem", value: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(B)) } },
        { yielded: "emit_event_user_gave_bad_main_problem" },
        { yielded: "expect_user_to_give_main_problem", continued_with: { type: "MainProblem", value: sequent(mk_map(["A", o], ["$_0", ml(B)]), ml(A)) } },
        { yielded: "emit_event_user_gave_bad_main_problem" },
        { yielded: "expect_user_to_give_main_problem", continued_with: { type: "MainProblem", value: sequent(mk_map(["A", o], ["A", o], ["$_0", ml(A)]), ml(A)) } },
        { yielded: "emit_event_user_gave_bad_main_problem" },
        { yielded: "expect_user_to_give_main_problem", continued_with: { type: "MainProblem", value: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(A)) } },
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
    get_user_selected_tactic_and_sub_problem(maclogic_specification.tactics, sub_problems_example_1, test_emit, test_expect),
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
    get_user_selected_tactic_and_sub_problem(maclogic_specification.tactics, sub_problems_example_2, test_emit, test_expect),
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
    get_user_selected_tactic_and_sub_problem(maclogic_specification.tactics, sub_problems_example_2, test_emit, test_expect),
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
    get_user_selected_tactic_and_sub_problem(maclogic_specification.tactics, sub_problems_example_2, test_emit, test_expect),
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
    get_user_selected_tactic_and_sub_problem(maclogic_specification.tactics, sub_problems_example_3, test_emit, test_expect),
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
    get_user_selected_tactic_and_sub_problem(maclogic_specification.tactics, sub_problems_example_3, test_emit, test_expect),
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
    get_user_selected_tactic_and_sub_problem(maclogic_specification.tactics, sub_problems_example_3, test_emit, test_expect),
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
    notify_user_about_error(maclogic_specification.errors, user_error("cookies", 1), test_emit, default_exceptions),
    {
        yields: [],
        throws: "exceptions_invalid_user_error_id: cookies"
    }
)

test_generator_expectation("can't find user_error_id 'chips'",
    notify_user_about_error(maclogic_specification.errors, user_error("chips", -1), test_emit, default_exceptions),
    {
        yields: [],
        throws: "exceptions_invalid_user_error_id: chips"
    }
)

test_generator_expectation("not_a_string payload is a string",
    notify_user_about_error(maclogic_specification.errors, user_error("not_a_string", "is_a_string"), test_emit, default_exceptions),
    {
        yields: [],
        throws: "exceptions_invalid_user_error_payload: not_a_string"
    }
)

test_generator_expectation("not_an_integer payload is an integer",
    notify_user_about_error(maclogic_specification.errors, user_error("not_an_integer", 0), test_emit, default_exceptions),
    {
        yields: [],
        throws: "exceptions_invalid_user_error_payload: not_an_integer"
    }
)

test_generator_expectation("not_a_string success",
    notify_user_about_error(maclogic_specification.errors, user_error("not_a_string", 0), test_emit, default_exceptions),
    {
        yields: [{ yielded: "emit_event_user_messed_up" }]
    }
)

test_generator_expectation("not_an_integer success",
    notify_user_about_error(maclogic_specification.errors, user_error("not_an_integer", "bun"), test_emit, default_exceptions),
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
        test_emit,
        test_expect,
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
        test_emit,
        test_expect,
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
        test_emit,
        test_expect,
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
        sub_problem(imv(0), sequent(mk_map(["A", o], ["a", ml(A)]), ml(A))),
        insert([], (m, v) => ov("a")),
        imv,
        iv,
        test_emit,
        default_exceptions
    ),
    { yields: [{ yielded: "emit_event_finished_tactic" }], returns: valid_proof_insert(ov("a"), [], []) }
)

test_generator_expectation(
    "is invalid",
    notify_user_about_insert(
        maclogic_specification.sig,
        sub_problem(imv(1), sequent(mk_map(["A", o], ["a", ml(A)]), ml(A))),
        insert([], (m, v) => ov("b")),
        imv,
        iv,
        test_emit,
        default_exceptions
    ),
    { yields: [], throws: "exceptions_invalid_proof_insert" }
)

const test_simple_interaction = (name: string, spec: VerifiedInteractionSpecification, interaction: GeneratorExpectation<any, any, any>): void =>
    test_generator_expectation(
        `run_interaction ${name}`,
        mk_run_interaction(
            test_expect,
            test_emit,
            default_exceptions
        )(spec),
        interaction
    )

test_simple_interaction("simple_single_close_sub_problem_first", maclogic_specification, {
    yields: [
        { yielded: "expect_user_to_give_main_problem", continued_with: { type: "MainProblem", value: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(A)) } },
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
        { yielded: "expect_user_to_give_main_problem", continued_with: { type: "MainProblem", value: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(A)) } },
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
        { yielded: "expect_user_to_give_main_problem", continued_with: { type: "MainProblem", value: sequent(mk_map(["A", o], ["B", o], ["a", ml(A)], ["b", ml(B)]), ml(and(A, B))) } },
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
        { yielded: "expect_user_to_give_main_problem", continued_with: { type: "MainProblem", value: sequent(mk_map(["A", o], ["B", o], ["a", ml(and(A, B))]), ml(B)) } },
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
        { yielded: "expect_user_to_give_main_problem", continued_with: { type: "MainProblem", value: sequent(mk_map(["A", o], ["B", o], ["a", ml(and(A, B))]), ml(B)) } },
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
        { yielded: "expect_user_to_give_main_problem", continued_with: { type: "MainProblem", value: sequent(mk_map(["A", o], ["B", o], ["F", pi(x, i, o)], ["G", pi(x, i, o)], ["a", ml(exists(x, and(F1(x), G1(x))))]), ml(exists(x, F1(x)))) } },
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
        { yielded: "expect_user_to_give_main_problem", continued_with: { type: "MainProblem", value: sequent(mk_map(["A", o], ["$_0", ml(B)]), ml(A)) } },
        { yielded: "emit_event_user_gave_bad_main_problem" },
        { yielded: "expect_user_to_give_main_problem", continued_with: { type: "MainProblem", value: sequent(mk_map(["A", o], ["$_0", ml(B)]), ml(A)) } },
        { yielded: "emit_event_user_gave_bad_main_problem" },
        { yielded: "expect_user_to_give_main_problem", continued_with: { type: "MainProblem", value: sequent(mk_map(["A", o], ["$_0", ml(A)]), ml(A)) } },
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
        { yielded: "expect_user_to_give_main_problem", continued_with: { type: "MainProblem", value: sequent(mk_map(["A", o]), ml(A)) } },
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
        { yielded: "expect_user_to_give_main_problem", continued_with: { type: "MainProblem", value: sequent(mk_map(["A", o], ["B", o]), ml(and(A, B))) } },
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
        { yielded: "expect_user_to_give_main_problem", continued_with: { type: 'MainProblem', value: sequent(mk_map(["A", o], ["B", o], ["a", ml(A)], ["b", ml(B)]), ml(and(A, B))) } },
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
        { yielded: "expect_user_to_give_main_problem", continued_with: { type: "MainProblem", value: sequent(mk_map(["A", o], ["B", o], ["a", ml(A)], ["b", ml(B)]), ml(and(A, B))) } },
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
