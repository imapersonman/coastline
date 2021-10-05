"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequent_1 = require("../../src/construction/sequent");
const tactic_error_1 = require("../../src/construction/tactic_error");
const user_error_1 = require("../../src/construction/user_error");
const verified_interaction_specification_tests_1 = require("../../src/construction/verified_interaction_specification_tests");
const shorthands_1 = require("../../src/lambda_pi/shorthands");
const RecursiveMap_1 = require("../../src/map/RecursiveMap");
const first_order_1 = require("../../src/unification/first_order");
const maclogic_verified_interaction_1 = require("./maclogic_verified_interaction");
test("maclogic interaction specification", () => expect((0, verified_interaction_specification_tests_1.generate_successful_verified_interaction_specification_test)(maclogic_tests)).toEqual((0, verified_interaction_specification_tests_1.generate_tested_verified_interaction_specification_test)(maclogic_verified_interaction_1.maclogic_specification, maclogic_tests)));
const [o, i, absurd] = (0, shorthands_1.clist)("o", "i", "absurd");
const [ml, and, imp] = [(0, shorthands_1.nary)("ml"), (0, shorthands_1.nary)("and"), (0, shorthands_1.nary)("imp")];
const exists = (x, body) => (0, shorthands_1.flapp)((0, shorthands_1.con)("exists"), (0, shorthands_1.la)(x, i, body));
const forall = (x, body) => (0, shorthands_1.flapp)((0, shorthands_1.con)("forall"), (0, shorthands_1.la)(x, i, body));
const andi = (0, shorthands_1.nary)("andi");
const [andel, ander] = [(0, shorthands_1.nary)("andel"), (0, shorthands_1.nary)("ander")];
const not = (0, shorthands_1.nary)("not");
const [X, Y] = (0, shorthands_1.mvlist)("X", "Y");
const [A, B, C, D] = (0, shorthands_1.ovlist)("A", "B", "C", "D");
const [F1, G1, H1] = [(x) => (0, shorthands_1.app)((0, shorthands_1.ov)("F"), x), (x) => (0, shorthands_1.app)((0, shorthands_1.ov)("G"), x), (x) => (0, shorthands_1.app)((0, shorthands_1.ov)("H"), x)];
const [T2, R2, S2] = [(x, y) => (0, shorthands_1.flapp)((0, shorthands_1.ov)("T"), x, y), (x, y) => (0, shorthands_1.flapp)((0, shorthands_1.ov)("R"), x, y), (x, y) => (0, shorthands_1.flapp)((0, shorthands_1.ov)("S"), x, y)];
const pt = (n) => n === 0 ? o : (0, shorthands_1.pi)((0, shorthands_1.iv)(n), i, pt(n - 1));
const [x, y] = (0, shorthands_1.ovlist)("x", "y");
const [u1, u2, u3, u4, u5] = (0, shorthands_1.iovlist)(1, 2, 3, 4, 5);
const maclogic_tests = {
    proof_tests: {
        valid: [
            { test_name: "o", proof: o, sort: shorthands_1.type_k },
            { test_name: "i", proof: i, sort: shorthands_1.type_k },
            { test_name: "absurd", proof: absurd, sort: o },
            { test_name: "not absurd", proof: not(absurd), sort: o },
            { test_name: "imp (not absurd) absurd", proof: imp(not(absurd), absurd), sort: o },
            { test_name: "and (not absurd) (imp (not absurd) absurd)", proof: and(not(absurd), imp(not(absurd), absurd)), sort: o },
            {
                test_name: "and associativity",
                proof: (0, shorthands_1.la)(A, o, (0, shorthands_1.la)(B, o, (0, shorthands_1.la)(C, o, (0, shorthands_1.la)(u1, ml(and(A, and(B, C))), (0, shorthands_1.flapp)((0, shorthands_1.la)(u2, ml(A), (0, shorthands_1.la)(u3, ml(and(B, C)), (0, shorthands_1.flapp)((0, shorthands_1.la)(u4, ml(B), (0, shorthands_1.la)(u5, ml(C), andi(and(A, B), C, andi(A, B, u2, u4), u5))), andel(B, C, u3), ander(B, C, u3)))), andel(A, and(B, C), u1), ander(A, and(B, C), u1)))))),
                sort: (0, shorthands_1.pi)(A, o, (0, shorthands_1.pi)(B, o, (0, shorthands_1.pi)(C, o, (0, shorthands_1.pi)(u1, ml(and(A, and(B, C))), ml(and(and(A, B), C))))))
            }
        ],
        invalid: []
    },
    tactic_tests: [
        {
            id: "close",
            valid: [
                { test_name: "1 assumption", sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["$_0", ml(A)]), ml(A)), responses: [] },
                { test_name: "2 assumptions 1 match", sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["a", ml(B)], ["$_0", ml(A)]), ml(B)), responses: [] },
                { test_name: "3 assumptions 2 match", sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["k", ml(A)], ["b", ml(C)], ["$_0", ml(A)]), ml(A)), responses: [] }
            ],
            invalid: [
                { test_name: "0 assumptions", sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(), ml(A)), responses: [], error: (0, user_error_1.user_error)("no_unifying_assumptions_found", ml(A)) },
                { test_name: "1 assumption", sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["$_0", ml(A)]), ml(C)), responses: [], error: (0, user_error_1.user_error)("no_unifying_assumptions_found", ml(C)) },
                { test_name: "2 assumptions", sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["a", ml(C)], ["$_0", ml(A)]), ml(B)), responses: [], error: (0, user_error_1.user_error)("no_unifying_assumptions_found", ml(B)) },
                { test_name: "3 assumptions", sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["k", ml(C)], ["b", ml(C)], ["$_0", ml(A)]), ml(B)), responses: [], error: (0, user_error_1.user_error)("no_unifying_assumptions_found", ml(B)) }
            ]
        },
        {
            id: "andi",
            valid: [
                { test_name: "0 assumptions unifies", sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["B", o]), ml(and(A, B))), responses: [] },
                { test_name: "1 assumption unifies", sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["B", o], ["C", o], ["D", o], ["a", ml(imp(A, B))]), ml(and(C, D))), responses: [] }
            ],
            invalid: [
                {
                    test_name: "0 assumptions doesn't unify",
                    sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["B", o]), ml(imp(A, B))),
                    responses: [],
                    error: (0, user_error_1.user_error)("unification_error", new first_order_1.ConflictingEquations([{}, [[ml(and(X, Y)), ml(imp(A, B))]]], [[(0, shorthands_1.con)("and"), (0, shorthands_1.con)("imp")]]))
                },
                {
                    test_name: "2 assumptions doesn't unify with conclusion but unifies with one of the assumptions",
                    sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["B", o], ["u1", ml(and(C, D))], ["u2", ml(B)]), ml(imp(A, B))),
                    responses: [],
                    error: (0, user_error_1.user_error)("unification_error", new first_order_1.ConflictingEquations([{}, [[ml(and(X, Y)), ml(imp(A, B))]]], [[(0, shorthands_1.con)("and"), (0, shorthands_1.con)("imp")]]))
                }
            ]
        },
        {
            id: "ande",
            valid: [
                {
                    test_name: "1 assumption 1 unifier",
                    sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["B", o], ["C", o], ["a", ml(and(B, C))]), ml(A)),
                    responses: [0]
                },
                {
                    test_name: "3 assumptions 1 unifier",
                    sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["B", o], ["C", o], ["D", o], ["u1", ml(and(A, B))], ["u2", ml(B)], ["u3", ml(and(C, D))]), ml(B)),
                    responses: [0]
                },
                {
                    test_name: "3 assumptions 2 unifiers choose 1st",
                    sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["B", o], ["C", o], ["D", o], ["u1", ml(and(A, B))], ["u2", ml(B)], ["u3", ml(and(C, D))]), ml(B)),
                    responses: [0]
                },
                {
                    test_name: "3 assumption 2 unifiers choose 2nd",
                    sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["B", o], ["C", o], ["D", o], ["u1", ml(and(A, B))], ["u2", ml(B)], ["u3", ml(and(C, D))]), ml(B)),
                    responses: [1]
                }
            ],
            invalid: [
                {
                    test_name: "3 assumptions no unifiers",
                    sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["B", o], ["C", o], ["D", o], ["u1", ml(A)], ["u2", ml(B)], ["u3", ml(C)]), ml(B)),
                    responses: [],
                    error: (0, user_error_1.user_error)("no_unifying_assumptions_found", ml(and(X, Y)))
                }
            ]
        },
        {
            id: "impi",
            valid: [
                { test_name: "0 assumptions unifies", sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["B", o]), ml(imp(A, B))), responses: [] },
                { test_name: "1 assumption unifies", sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["B", o], ["C", o], ["D", o], ["a", ml(imp(A, B))]), ml(imp(C, D))), responses: [] }
            ],
            invalid: [
                {
                    test_name: "0 assumptions doesn't unify",
                    sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["B", o]), ml(and(A, B))),
                    responses: [],
                    error: (0, user_error_1.user_error)("unification_error", new first_order_1.ConflictingEquations([{}, [[ml(imp(X, Y)), ml(and(A, B))]]], [[(0, shorthands_1.con)("imp"), (0, shorthands_1.con)("and")]]))
                },
                {
                    test_name: "2 assumptions doesn't unify with conclusion but unifies with one of the assumptions",
                    sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["B", o], ["u1", ml(imp(C, D))], ["u2", ml(B)]), ml(and(A, B))),
                    responses: [],
                    error: (0, user_error_1.user_error)("unification_error", new first_order_1.ConflictingEquations([{}, [[ml(imp(X, Y)), ml(and(A, B))]]], [[(0, shorthands_1.con)("imp"), (0, shorthands_1.con)("and")]]))
                }
            ]
        },
        {
            id: "impe",
            valid: [
                {
                    test_name: "1 assumption 1 unifier",
                    sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["B", o], ["C", o], ["a", ml(imp(B, C))]), ml(A)),
                    responses: [0]
                },
                {
                    test_name: "3 assumptions 1 unifier",
                    sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["B", o], ["C", o], ["D", o], ["u1", ml(imp(A, B))], ["u2", ml(B)], ["u3", ml(imp(C, D))]), ml(B)),
                    responses: [0]
                },
                {
                    test_name: "3 assumptions 2 unifiers choose 1st",
                    sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["B", o], ["C", o], ["D", o], ["u1", ml(imp(A, B))], ["u2", ml(B)], ["u3", ml(imp(C, D))]), ml(B)),
                    responses: [0]
                },
                {
                    test_name: "3 assumption 2 unifiers choose 2nd",
                    sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["B", o], ["C", o], ["D", o], ["u1", ml(imp(A, B))], ["u2", ml(B)], ["u3", ml(imp(C, D))]), ml(B)),
                    responses: [1]
                }
            ],
            invalid: [
                {
                    test_name: "3 assumptions no unifiers",
                    sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["B", o], ["C", o], ["D", o], ["u1", ml(A)], ["u2", ml(B)], ["u3", ml(C)]), ml(B)),
                    responses: [],
                    error: (0, user_error_1.user_error)("no_unifying_assumptions_found", ml(imp(X, Y)))
                }
            ]
        },
        {
            id: "existsi",
            valid: [
                // conclusion unifies with ml (exists ?X), variable name already exists
                {
                    test_name: "conclusion unifies with ml (exists ?X), variable name already exists",
                    sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["b", i], ["B", o], ["G", pt(1)]), ml(exists(x, and(G1(x), B)))),
                    responses: ["b"]
                },
                // conclusion unifies with ml (exists ?X), variable name already exists
                {
                    test_name: "multiple assumptions, conclusion unifies with ml (exists ?X), variable name already exists",
                    sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["y", i], ["B", o], ["a1", ml(A)], ["b", ml(B)], ["H", pt(1)]), ml(exists(x, and(A, H1(x))))),
                    responses: ["y"]
                },
                // conclusion unifies with ml (exists ?X), variable name doesn't exist
                {
                    test_name: "multiple assumptions, conclusion unifies with ml (exists ?X), variable name doesn't exist",
                    sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["B", o], ["a1", ml(A)], ["b", ml(B)], ["F", pt(1)], ["G", pt(1)]), ml(exists(y, and(F1(y), G1(y))))),
                    responses: ["a"]
                }
            ],
            invalid: [
                // conclusion doesn't unify with ml (exists ?X), unification_error
                {
                    test_name: "multiple assumptions, conclusion doesn't unify with ml (exists ?X), unification_error",
                    sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["B", o], ["a1", ml(A)], ["b", ml(B)]), ml(forall(y, and(A, B)))),
                    responses: [],
                    error: (0, user_error_1.user_error)("unification_error", new first_order_1.ConflictingEquations([{}, [[(0, shorthands_1.app)((0, shorthands_1.con)("exists"), X), forall(y, and(A, B))]]], [[(0, shorthands_1.con)("exists"), (0, shorthands_1.con)("forall")]]))
                }
            ]
        },
        {
            id: "existse",
            valid: [
                {
                    test_name: "1 assumption 1 unifying",
                    sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["T", pt(2)], ["t", ml(exists(x, T2(x, x)))]), ml(A)),
                    responses: [0, "a"]
                },
                {
                    test_name: "3 assumptions 2 unifying",
                    sequent: (0, sequent_1.sequent)((0, RecursiveMap_1.mk_map)(["A", o], ["T", pt(2)], ["R", pt(2)], ["S", pt(2)], ["t", ml(exists(x, T2(x, y)))], ["r", ml(and(C, D))], ["s", ml(exists(x, exists(y, and(R2(x, y), S2(y, x)))))]), ml(A)),
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
                    error: (0, tactic_error_1.tactic_error)("any_variable parameter is defined")
                },
                {
                    test_name: "some other defined value",
                    parameter: "cool",
                    error: (0, tactic_error_1.tactic_error)("any_variable parameter is defined")
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
                            error: (0, user_error_1.user_error)("not_a_variable_name", 2)
                        },
                        {
                            test_name: "given some object instead of a string",
                            response: { cool: "beans" },
                            error: (0, user_error_1.user_error)("not_a_variable_name", { cool: "beans" })
                        }
                    ],
                    valid: [
                        {
                            test_name: "Given the variable id 'a'",
                            response: "a",
                            transformed_response: (0, shorthands_1.ov)("a")
                        },
                        {
                            test_name: "Given a string containing a space cuz why not?",
                            response: "something cool",
                            transformed_response: (0, shorthands_1.ov)("something cool")
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
                    error: (0, tactic_error_1.tactic_error)("used_variable parameter should be a Ctx"),
                },
                {
                    test_name: "Not a ctx instead just a really smart integer",
                    parameter: 42069,
                    error: (0, tactic_error_1.tactic_error)("used_variable parameter should be a Ctx")
                }
            ],
            valid: [
                {
                    test_name: "Empty ctx so no variable is accepted",
                    parameter: (0, RecursiveMap_1.mk_map)(),
                    transformed_parameter: (0, RecursiveMap_1.mk_map)(),
                    invalid_responses: [
                        {
                            test_name: "Gives a non-string",
                            response: 9,
                            error: (0, user_error_1.user_error)("not_a_string", 9)
                        },
                        {
                            test_name: "Some string but we have an empty ctx so nothing matters",
                            response: "socks",
                            error: (0, user_error_1.user_error)("variable_does_not_exist", (0, shorthands_1.ov)("socks"))
                        }
                    ],
                    // There's no such thing as an existing variable if the given ctx is empty.
                    valid: []
                },
                {
                    test_name: "Ctx with some stuff in it like a sock idc",
                    parameter: (0, RecursiveMap_1.mk_map)(["socks", ml(A)], ["with_puppies_on_them", ml(B)]),
                    transformed_parameter: (0, RecursiveMap_1.mk_map)(["socks", ml(A)], ["with_puppies_on_them", ml(B)]),
                    invalid_responses: [
                        {
                            test_name: "A string that's still not in the ctx",
                            response: "pants",
                            error: (0, user_error_1.user_error)("variable_does_not_exist", (0, shorthands_1.ov)("pants"))
                        }
                    ],
                    valid: [
                        {
                            test_name: "A string that's in the ctx cool",
                            response: "socks",
                            transformed_response: (0, shorthands_1.ov)("socks")
                        },
                        {
                            test_name: "Another string that's in the ctx less cool",
                            response: "with_puppies_on_them",
                            transformed_response: (0, shorthands_1.ov)("with_puppies_on_them")
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
                    error: (0, tactic_error_1.tactic_error)("unused_variable parameter should be a Ctx"),
                },
                {
                    test_name: "Not a ctx instead just a really smart integer",
                    parameter: 42069,
                    error: (0, tactic_error_1.tactic_error)("unused_variable parameter should be a Ctx")
                }
            ],
            valid: [
                {
                    test_name: "Empty ctx so any string variable is accepted",
                    parameter: (0, RecursiveMap_1.mk_map)(),
                    transformed_parameter: (0, RecursiveMap_1.mk_map)(),
                    invalid_responses: [
                        {
                            test_name: "Gives a non-string",
                            response: 9,
                            error: (0, user_error_1.user_error)("not_a_string", 9)
                        }
                    ],
                    // There's no such thing as an existing variable if the given ctx is empty.
                    valid: [
                        {
                            test_name: "Some string but we have an empty ctx so anything goes",
                            response: "socks",
                            transformed_response: (0, shorthands_1.ov)("socks")
                        }
                    ]
                },
                {
                    test_name: "Ctx with some stuff in it like a sock idc",
                    parameter: (0, RecursiveMap_1.mk_map)(["socks", ml(A)], ["with_puppies_on_them", ml(B)]),
                    transformed_parameter: (0, RecursiveMap_1.mk_map)(["socks", ml(A)], ["with_puppies_on_them", ml(B)]),
                    invalid_responses: [
                        {
                            test_name: "A string that's in the ctx",
                            response: "socks",
                            error: (0, user_error_1.user_error)("variable_exists", (0, shorthands_1.ov)("socks"))
                        }
                    ],
                    valid: [
                        {
                            test_name: "A string that's not in the ctx cool",
                            response: "pants",
                            transformed_response: (0, shorthands_1.ov)("pants")
                        },
                        {
                            test_name: "Another string that's not in the ctx less cool",
                            response: "with_tigers_on_them",
                            transformed_response: (0, shorthands_1.ov)("with_tigers_on_them")
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
                { test_name: "totes a variable", payload: (0, shorthands_1.ov)("cool") },
                { test_name: "totes another variable", payload: (0, shorthands_1.ov)("beans") }
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
                { test_name: "totes a variable", payload: (0, shorthands_1.ov)("cool") },
                { test_name: "totes another variable", payload: (0, shorthands_1.ov)("beans") }
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
};
