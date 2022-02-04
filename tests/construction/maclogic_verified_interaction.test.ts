import { sequent } from "../../src/construction/sequent"
import { tactic_error } from "../../src/construction/tactic_error"
import { user_error } from "../../src/construction/user_error"
import { generate_successful_verified_interaction_specification_test, generate_tested_verified_interaction_specification_test, VerifiedInteractionSpecificationTests } from "../../src/construction/verified_interaction_specification_tests"
import { Ast, Variable } from "../../src/lambda_pi/ast"
import { app, clist, con, flapp, iovlist, iv, la, mvlist, nary, ov, ovlist, pi, type_k } from "../../src/lambda_pi/shorthands"
import { mk_map } from "../../src/map/RecursiveMap"
import { ConflictingEquations } from "../../src/unification/first_order"
import { maclogic_specification } from "../../src/construction/maclogic_verified_interaction"

test.skip("maclogic interaction specification", () =>
    expect(
        generate_successful_verified_interaction_specification_test(maclogic_tests)
    ).toEqual(
        generate_tested_verified_interaction_specification_test(maclogic_specification, maclogic_tests)
    ))

const [o, i, absurd] = clist("o", "i", "absurd")
const [ml, and, imp] = [nary<[]>("ml"), nary<[Ast]>("and"), nary<[Ast]>("imp")]
const exists = (x: Variable, body: Ast): Ast => flapp(con("exists"), la(x, i, body))
const forall = (x: Variable, body: Ast): Ast => flapp(con("forall"), la(x, i, body))
const andi = nary<[Ast, Ast, Ast]>("andi")
const [andel, ander] = [nary<[Ast, Ast]>("andel"), nary<[Ast, Ast]>("ander")]
const not = nary<[]>("not")
const [X, Y] = mvlist("X", "Y")
const [A, B, C, D] = ovlist("A", "B", "C", "D")
const [F1, G1, H1] = [(x) => app(ov("F"), x), (x) => app(ov("G"), x), (x) => app(ov("H"), x)]
const [T2, R2, S2] = [(x, y) => flapp(ov("T"), x, y), (x, y) => flapp(ov("R"), x, y), (x, y) => flapp(ov("S"), x, y)]
const pt = (n: number): Ast => n === 0 ? o : pi(iv(n), i, pt(n - 1))
const [x, y] = ovlist("x", "y")
const [u1, u2, u3, u4, u5] = iovlist(1, 2, 3, 4, 5)
const maclogic_tests: VerifiedInteractionSpecificationTests = {
    proof_tests: {
        valid: [
            { test_name: "o", proof: o, sort: type_k },
            { test_name: "i", proof: i, sort: type_k },
            { test_name: "absurd", proof: absurd, sort: o },
            { test_name: "not absurd", proof: not(absurd), sort: o },
            { test_name: "imp (not absurd) absurd", proof: imp(not(absurd), absurd), sort: o },
            { test_name: "and (not absurd) (imp (not absurd) absurd)", proof: and(not(absurd), imp(not(absurd), absurd)), sort: o },
            {
                test_name: "and associativity",
                proof:
                    la(A, o, la(B, o, la(C, o, la(u1, ml(and(A, and(B, C))),
                        flapp(
                            la(u2, ml(A), la(u3, ml(and(B, C)),
                                flapp(
                                    la(u4, ml(B), la(u5, ml(C), andi(and(A, B), C, andi(A, B, u2, u4), u5))),
                                    andel(B, C, u3),
                                    ander(B, C, u3)))),
                            andel(A, and(B, C), u1),
                            ander(A, and(B, C), u1)))))),
                sort: pi(A, o, pi(B, o, pi(C, o, pi(u1, ml(and(A, and(B, C))), ml(and(and(A, B), C))))))
            }
        ],
        invalid: []
    },
    tactic_tests: [
        {
            id: "close",
            valid: [
                { test_name: "1 assumption", sequent: sequent(mk_map(["$_0", ml(A)]), ml(A)), responses: [] },
                { test_name: "2 assumptions 1 match", sequent: sequent(mk_map(["a", ml(B)], ["$_0", ml(A)]), ml(B)), responses: [] },
                { test_name: "3 assumptions 2 match", sequent: sequent(mk_map(["k", ml(A)], ["b", ml(C)], ["$_0", ml(A)]), ml(A)), responses: [] }
            ],
            invalid: [
                { test_name: "0 assumptions", sequent: sequent(mk_map(), ml(A)), responses: [], error: user_error("no_unifying_assumptions_found", ml(A)) },
                { test_name: "1 assumption", sequent: sequent(mk_map(["$_0", ml(A)]), ml(C)), responses: [], error: user_error("no_unifying_assumptions_found", ml(C)) },
                { test_name: "2 assumptions", sequent: sequent(mk_map(["a", ml(C)], ["$_0", ml(A)]), ml(B)), responses: [], error: user_error("no_unifying_assumptions_found", ml(B)) },
                { test_name: "3 assumptions", sequent: sequent(mk_map(["k", ml(C)], ["b", ml(C)], ["$_0", ml(A)]), ml(B)), responses: [], error: user_error("no_unifying_assumptions_found", ml(B)) }
            ]
        },
        {
            id: "andi",
            valid: [
                { test_name: "0 assumptions unifies", sequent: sequent(mk_map(["A", o], ["B", o]), ml(and(A, B))), responses: [] },
                { test_name: "1 assumption unifies", sequent: sequent(mk_map<Ast>(["A", o], ["B", o], ["C", o], ["D", o], ["a", ml(imp(A, B))]), ml(and(C, D))), responses: [] }
            ],
            invalid: [
                {
                    test_name: "0 assumptions doesn't unify",
                    sequent: sequent(mk_map(["A", o], ["B", o]), ml(imp(A, B))),
                    responses: [],
                    error: user_error("unification_error", new ConflictingEquations([{}, [[ml(and(X, Y)), ml(imp(A, B))]]], [[con("and"), con("imp")]]))
                },
                {
                    test_name: "2 assumptions doesn't unify with conclusion but unifies with one of the assumptions",
                    sequent: sequent(mk_map<Ast>(["A", o], ["B", o], ["u1", ml(and(C, D))], ["u2", ml(B)]), ml(imp(A, B))),
                    responses: [],
                    error: user_error("unification_error", new ConflictingEquations([{}, [[ml(and(X, Y)), ml(imp(A, B))]]], [[con("and"), con("imp")]]))
                }
            ]
        },
        {
            id: "ande",
            valid: [
                {
                    test_name: "1 assumption 1 unifier",
                    sequent: sequent(mk_map<Ast>(["A", o], ["B", o], ["C", o], ["a", ml(and(B, C))]), ml(A)),
                    responses: [0]
                },
                {
                    test_name: "3 assumptions 1 unifier",
                    sequent: sequent(mk_map<Ast>(["A", o], ["B", o], ["C", o], ["D", o], ["u1", ml(and(A, B))], ["u2", ml(B)], ["u3", ml(and(C, D))]), ml(B)),
                    responses: [0]
                },
                {
                    test_name: "3 assumptions 2 unifiers choose 1st",
                    sequent: sequent(mk_map<Ast>(["A", o], ["B", o], ["C", o], ["D", o], ["u1", ml(and(A, B))], ["u2", ml(B)], ["u3", ml(and(C, D))]), ml(B)),
                    responses: [0]
                },
                {
                    test_name: "3 assumption 2 unifiers choose 2nd",
                    sequent: sequent(mk_map<Ast>(["A", o], ["B", o], ["C", o], ["D", o], ["u1", ml(and(A, B))], ["u2", ml(B)], ["u3", ml(and(C, D))]), ml(B)),
                    responses: [1]
                }
            ],
            invalid: [
                {
                    test_name: "3 assumptions no unifiers",
                    sequent: sequent(mk_map<Ast>(["A", o], ["B", o], ["C", o], ["D", o], ["u1", ml(A)], ["u2", ml(B)], ["u3", ml(C)]), ml(B)),
                    responses: [],
                    error: user_error("no_unifying_assumptions_found", ml(and(X, Y)))
                }
            ]
        },
        {
            id: "impi",
            valid: [
                { test_name: "0 assumptions unifies", sequent: sequent(mk_map(["A", o], ["B", o]), ml(imp(A, B))), responses: [] },
                { test_name: "1 assumption unifies", sequent: sequent(mk_map<Ast>(["A", o], ["B", o], ["C", o], ["D", o], ["a", ml(imp(A, B))]), ml(imp(C, D))), responses: [] }
            ],
            invalid: [
                {
                    test_name: "0 assumptions doesn't unify",
                    sequent: sequent(mk_map(["A", o], ["B", o]), ml(and(A, B))),
                    responses: [],
                    error: user_error("unification_error", new ConflictingEquations([{}, [[ml(imp(X, Y)), ml(and(A, B))]]], [[con("imp"), con("and")]]))
                },
                {
                    test_name: "2 assumptions doesn't unify with conclusion but unifies with one of the assumptions",
                    sequent: sequent(mk_map<Ast>(["A", o], ["B", o], ["u1", ml(imp(C, D))], ["u2", ml(B)]), ml(and(A, B))),
                    responses: [],
                    error: user_error("unification_error", new ConflictingEquations([{}, [[ml(imp(X, Y)), ml(and(A, B))]]], [[con("imp"), con("and")]]))
                }
            ]
        },
        {
            id: "impe",
            valid: [
                {
                    test_name: "1 assumption 1 unifier",
                    sequent: sequent(mk_map<Ast>(["A", o], ["B", o], ["C", o], ["a", ml(imp(B, C))]), ml(A)),
                    responses: [0]
                },
                {
                    test_name: "3 assumptions 1 unifier",
                    sequent: sequent(mk_map<Ast>(["A", o], ["B", o], ["C", o], ["D", o], ["u1", ml(imp(A, B))], ["u2", ml(B)], ["u3", ml(imp(C, D))]), ml(B)),
                    responses: [0]
                },
                {
                    test_name: "3 assumptions 2 unifiers choose 1st",
                    sequent: sequent(mk_map<Ast>(["A", o], ["B", o], ["C", o], ["D", o], ["u1", ml(imp(A, B))], ["u2", ml(B)], ["u3", ml(imp(C, D))]), ml(B)),
                    responses: [0]
                },
                {
                    test_name: "3 assumption 2 unifiers choose 2nd",
                    sequent: sequent(mk_map<Ast>(["A", o], ["B", o], ["C", o], ["D", o], ["u1", ml(imp(A, B))], ["u2", ml(B)], ["u3", ml(imp(C, D))]), ml(B)),
                    responses: [1]
                }
            ],
            invalid: [
                {
                    test_name: "3 assumptions no unifiers",
                    sequent: sequent(mk_map<Ast>(["A", o], ["B", o], ["C", o], ["D", o], ["u1", ml(A)], ["u2", ml(B)], ["u3", ml(C)]), ml(B)),
                    responses: [],
                    error: user_error("no_unifying_assumptions_found", ml(imp(X, Y)))
                }
            ]
        },
        {
            id: "existsi",
            valid: [
                // conclusion unifies with ml (exists ?X), variable name already exists
                {
                    test_name: "conclusion unifies with ml (exists ?X), variable name already exists",
                    sequent: sequent(mk_map<Ast>(["A", o], ["b", i], ["B", o], ["G", pt(1)]), ml(exists(x, and(G1(x), B)))),
                    responses: ["b"]
                },
                // conclusion unifies with ml (exists ?X), variable name already exists
                {
                    test_name: "multiple assumptions, conclusion unifies with ml (exists ?X), variable name already exists",
                    sequent: sequent(mk_map<Ast>(["A", o], ["y", i], ["B", o], ["a1", ml(A)], ["b", ml(B)], ["H", pt(1)]), ml(exists(x, and(A, H1(x))))),
                    responses: ["y"]
                },
                // conclusion unifies with ml (exists ?X), variable name doesn't exist
                {
                    test_name: "multiple assumptions, conclusion unifies with ml (exists ?X), variable name doesn't exist",
                    sequent: sequent(mk_map<Ast>(["A", o], ["B", o], ["a1", ml(A)], ["b", ml(B)], ["F", pt(1)], ["G", pt(1)]), ml(exists(y, and(F1(y), G1(y))))),
                    responses: ["a"]
                }
            ],
            invalid: [
                // conclusion doesn't unify with ml (exists ?X), unification_error
                {
                    test_name: "multiple assumptions, conclusion doesn't unify with ml (exists ?X), unification_error",
                    sequent: sequent(mk_map<Ast>(["A", o], ["B", o], ["a1", ml(A)], ["b", ml(B)]), ml(forall(y, and(A, B)))),
                    responses: [],
                    error: user_error("unification_error", new ConflictingEquations([{}, [[app(con("exists"), X), forall(y, and(A, B))]]], [[con("exists"), con("forall")]]))
                }
            ]
        },
        {
            id: "existse",
            valid: [
                {
                    test_name: "1 assumption 1 unifying",
                    sequent: sequent(mk_map<Ast>(["A", o], ["T", pt(2)], ["t", ml(exists(x, T2(x, x)))]), ml(A)),
                    responses: [0, "a"]
                },
                {
                    test_name: "3 assumptions 2 unifying",
                    sequent: sequent(mk_map<Ast>(["A", o], ["T", pt(2)], ["R", pt(2)], ["S", pt(2)], ["t", ml(exists(x, T2(x, y)))], ["r", ml(and(C, D))], ["s", ml(exists(x, exists(y, and(R2(x, y), S2(y, x)))))]), ml(A)),
                    responses: [1, "b"]
                }
            ],
            invalid: [
                // // conclusion doesn't unify with ml, unification_error
                // test_name: "conclusion doesn't unify with ml, unification_error"
            ]
        }
    ],
    request_tests: [
        {
            id: "any_variable",
            invalid_parameters: [
                {
                    test_name: "isn't undefined",
                    parameter: 3,
                    error: tactic_error("any_variable parameter is defined")
                },
                {
                    test_name: "some other defined value",
                    parameter: "cool",
                    error: tactic_error("any_variable parameter is defined")
                }
            ],
            valid: [
                {
                    test_name: "Given undefined like god intended",
                    parameter: undefined,
                    transformed_parameter: undefined,
                    invalid_responses: [
                        {
                            test_name: "given a number instead of a string",
                            response: 2,
                            error: user_error("not_a_variable_name", 2) 
                        },
                        {
                            test_name: "given some object instead of a string",
                            response: { cool: "beans" },
                            error: user_error("not_a_variable_name", { cool: "beans" })
                        }
                    ],
                    valid: [
                        {
                            test_name: "Given the variable id 'a'",
                            response: "a",
                            transformed_response: ov("a")
                        },
                        {
                            test_name: "Given a string containing a space cuz why not?",
                            response: "something cool",
                            transformed_response: ov("something cool")
                        }
                    ]
                }
            ]
        },
        {
            id: "used_variable",
            invalid_parameters: [
                {
                    test_name: "Not a ctx instead just a dumb list",
                    parameter: [["a", A], ["b", B]],
                    error: tactic_error("used_variable parameter should be a Ctx"),
                },
                {
                    test_name: "Not a ctx instead just a really smart integer",
                    parameter: 42069,
                    error: tactic_error("used_variable parameter should be a Ctx")
                }
            ],
            valid: [
                {
                    test_name: "Empty ctx so no variable is accepted",
                    parameter: mk_map(),
                    transformed_parameter: mk_map(),
                    invalid_responses: [
                        {
                            test_name: "Gives a non-string",
                            response: 9,
                            error: user_error("not_a_string", 9)
                        },
                        {
                            test_name: "Some string but we have an empty ctx so nothing matters",
                            response: "socks",
                            error: user_error("variable_does_not_exist", ov("socks"))
                        }
                    ],
                    // There's no such thing as an existing variable if the given ctx is empty.
                    valid: []
                },
                {
                    test_name: "Ctx with some stuff in it like a sock idc",
                    parameter: mk_map(["socks", ml(A)], ["with_puppies_on_them", ml(B)]),
                    transformed_parameter: mk_map(["socks", ml(A)], ["with_puppies_on_them", ml(B)]),
                    invalid_responses: [
                        {
                            test_name: "A string that's still not in the ctx",
                            response: "pants",
                            error: user_error("variable_does_not_exist", ov("pants"))
                        }
                    ],
                    valid: [
                        {
                            test_name: "A string that's in the ctx cool",
                            response: "socks",
                            transformed_response: ov("socks")
                        },
                        {
                            test_name: "Another string that's in the ctx less cool",
                            response: "with_puppies_on_them",
                            transformed_response: ov("with_puppies_on_them")
                        }
                    ]
                }
            ]
        },
        {
            id: "unused_variable",
            invalid_parameters: [
                {
                    test_name: "Not a ctx instead just a dumb list",
                    parameter: [["a", A], ["b", B]],
                    error: tactic_error("unused_variable parameter should be a Ctx"),
                },
                {
                    test_name: "Not a ctx instead just a really smart integer",
                    parameter: 42069,
                    error: tactic_error("unused_variable parameter should be a Ctx")
                }
            ],
            valid: [
                {
                    test_name: "Empty ctx so any string variable is accepted",
                    parameter: mk_map(),
                    transformed_parameter: mk_map(),
                    invalid_responses: [
                        {
                            test_name: "Gives a non-string",
                            response: 9,
                            error: user_error("not_a_string", 9)
                        }
                    ],
                    // There's no such thing as an existing variable if the given ctx is empty.
                    valid: [
                        {
                            test_name: "Some string but we have an empty ctx so anything goes",
                            response: "socks",
                            transformed_response: ov("socks")
                        }
                    ]
                },
                {
                    test_name: "Ctx with some stuff in it like a sock idc",
                    parameter: mk_map(["socks", ml(A)], ["with_puppies_on_them", ml(B)]),
                    transformed_parameter: mk_map(["socks", ml(A)], ["with_puppies_on_them", ml(B)]),
                    invalid_responses: [
                        {
                            test_name: "A string that's in the ctx",
                            response: "socks",
                            error: user_error("variable_exists", ov("socks"))
                        }
                    ],
                    valid: [
                        {
                            test_name: "A string that's not in the ctx cool",
                            response: "pants",
                            transformed_response: ov("pants")
                        },
                        {
                            test_name: "Another string that's not in the ctx less cool",
                            response: "with_tigers_on_them",
                            transformed_response: ov("with_tigers_on_them")
                        }
                    ]
                }
            ]
        },
    ],
    error_tests: [
        // not_a_variable_name
        {
            id: "not_a_variable_name",
            valid: [
                { test_name: "a number", payload: 2 }
            ],
            invalid: [
                { test_name: "simple string", payload: "cool" }
            ]
        },
        // variable_does_not_exist
        {
            id: "variable_does_not_exist",
            valid: [
                { test_name: "totes a variable", payload: ov("cool") },
                { test_name: "totes another variable", payload: ov("beans") }
            ],
            invalid: [
                { test_name: "totes not a variable", payload: 9 },
                { test_name: "totes another not variable", payload: { cool: "beans" } }
            ]
        },
        // variable_exists
        {
            id: "variable_exists",
            valid: [
                { test_name: "totes a variable", payload: ov("cool") },
                { test_name: "totes another variable", payload: ov("beans") }
            ],
            invalid: [
                { test_name: "totes not a variable", payload: 9 },
                { test_name: "totes another not variable", payload: { cool: "beans" } }
            ]
        },
        // unification_error
        {
            id: "unification_error",
            valid: [],
            invalid: []
        },
        // no_unifying_assumptions_found
        {
            id: "no_unifying_assumptions_found",
            valid: [],
            invalid: []
        },
        // no_unifying_assumptions_or_conclusion_found
        {
            id: "no_unifying_assumptions_or_conclusion_found",
            valid: [],
            invalid: []
        }
    ]
}