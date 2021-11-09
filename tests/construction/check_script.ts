import { try_parse_then_elaborate_sequent } from "../../src/maclogic/parse_then_elaborate";

// proof script
// current problem
// sub problem stack
// derivation tree
// proof

interface CurrentProblem {
    using: string[],
    derive: string
}

interface ProofScript {
    root_problem: { assumptions: string, conclusion: string }
    tactic_applications: { tactic: string, arguments: any[] }[]
}

type SubProblemStack = { assumptions: string, conclusion: string }[]

type DerivationTree =
    | { derivation_type: "Unfinished", problem: { assumptions: string, conclusion: string } }
    | { derivation_type: "Finished",
        problem: { assumptions: string, conclusion: string },
        sub_derivations: DerivationTree[]
        tactic_application: { tactic: string, arguments: any[] } }

type LineReference = number | { ref: number }

type Proof = {
    line_number: number | { ref: number }
    assumption_references: undefined | LineReference[]
    proposition: string
    justification:
        | undefined
        | "Premise"
        | { reference: number, name: "&E" }
        | { left_reference: LineReference, right_reference: LineReference, name: "&I" }
        | { major_reference: LineReference, minor_reference: LineReference, name: "→E" }
}[]

interface InteractionFrame {
    current_problem: CurrentProblem | undefined
    proof_script: ProofScript
    sub_problem_stack: SubProblemStack
    derivation_tree: DerivationTree
    proofs: Proof[]
}


const forbes_42_example_1: InteractionFrame[] = [
    // 1
    {
        current_problem: {
            using: ["A & B", "C & D", "(A & D) → H"],
            derive: "H"
        },
        proof_script: {
            root_problem: {
                assumptions: "A & B, C & D, (A & D) → H",
                conclusion: "H"
            },
            tactic_applications: []
        },
        sub_problem_stack: [
            {
                assumptions: "A & B, C & D, (A & D) → H",
                conclusion: "H"
            }
        ],
        derivation_tree: {
            derivation_type: "Unfinished",
            problem: {
                assumptions: "A & B, C & D, (A & D) → H",
                conclusion: "H"
            }
        },
        proofs: [
            [
                {
                    line_number: 1,
                    assumption_references: [1],
                    proposition: "A & B",
                    justification: "Premise"
                },
                {
                    line_number: 2,
                    assumption_references: [2],
                    proposition: "C & D",
                    justification: "Premise"
                },
                {
                    line_number: 3,
                    assumption_references: [3],
                    proposition: "(A & D) → H",
                    justification: "Premise"
                },
                {
                    line_number: { ref: 0 },
                    assumption_references: undefined,
                    proposition: "H",
                    justification: undefined
                }
            ]
        ]
    },
    // 2
    {
        current_problem: {
            using: ["C & D", "(A & D) → H", "A", "B"],
            derive: "H"
        },
        proof_script: {
            root_problem: {
                assumptions: "A & B, C & D, (A & D) → H",
                conclusion: "H"
            },
            tactic_applications: [
                { tactic: "&E", arguments: [0] }
            ]
        },
        sub_problem_stack: [
            {
                assumptions: "C & D, (A & D) → H, A, B",
                conclusion: "H"
            }
        ],
        derivation_tree: {
            derivation_type: "Finished",
            problem: {
                assumptions: "A & B, C & D, (A & D) → H",
                conclusion: "H"
            },
            tactic_application: { tactic: "&E", arguments: ["A & B"] },
            sub_derivations: [
                {
                    derivation_type: "Unfinished",
                    problem: {
                        assumptions: "C & D, (A & D) → H, A, B",
                        conclusion: "H"
                    }
                }
            ]
        },
        proofs: [
            [
                {
                    line_number: 1,
                    assumption_references: [1],
                    proposition: "A & B",
                    justification: "Premise"
                },
                {
                    line_number: 2,
                    assumption_references: [2],
                    proposition: "C & D",
                    justification: "Premise"
                },
                {
                    line_number: 3,
                    assumption_references: [3],
                    proposition: "(A & D) → H",
                    justification: "Premise"
                },
                {
                    line_number: 4,
                    assumption_references: [1],
                    proposition: "A",
                    justification: { name: "&E", reference: 1 }
                },
                {
                    line_number: 5,
                    assumption_references: [1],
                    proposition: "B",
                    justification: { name: "&E", reference: 1 }
                },
                {
                    line_number: { ref: 0 },
                    assumption_references: undefined,
                    proposition: "H",
                    justification: undefined
                }
            ]
        ]
    },
    // 3
    {
        current_problem: {
            using: ["(A & D) → H", "A", "B", "C", "D"],
            derive: "H"
        },
        proof_script: {
            root_problem: {
                assumptions: "A & B, C & D, (A & D) → H",
                conclusion: "H"
            },
            tactic_applications: [
                { tactic: "&E", arguments: [0] },
                { tactic: "&E", arguments: [0] }
            ]
        },
        sub_problem_stack: [
            {
                assumptions: "(A & D) → H, A, B, C, D",
                conclusion: "H"
            }
        ],
        derivation_tree: {
            derivation_type: "Finished",
            problem: {
                assumptions: "A & B, C & D, (A & D) → H",
                conclusion: "H"
            },
            tactic_application: { tactic: "&E", arguments: ["A & B"] },
            sub_derivations: [
                {
                    derivation_type: "Finished",
                    tactic_application: { tactic: "&E", arguments: ["C & D"] },
                    problem: {
                        assumptions: "C & D, (A & D) → H, A, B",
                        conclusion: "H"
                    },
                    sub_derivations: [
                        {
                            derivation_type: "Unfinished",
                            problem: {
                                assumptions: "(A & D) → H, A, B, C, D",
                                conclusion: "H"
                            }
                        }
                    ]
                }
            ]
        },
        proofs: [
            [
                {
                    line_number: 1,
                    assumption_references: [1],
                    proposition: "A & B",
                    justification: "Premise"
                },
                {
                    line_number: 2,
                    assumption_references: [2],
                    proposition: "C & D",
                    justification: "Premise"
                },
                {
                    line_number: 3,
                    assumption_references: [3],
                    proposition: "(A & D) → H",
                    justification: "Premise"
                },
                {
                    line_number: 4,
                    assumption_references: [1],
                    proposition: "A",
                    justification: { name: "&E", reference: 1 }
                },
                {
                    line_number: 5,
                    assumption_references: [1],
                    proposition: "B",
                    justification: { name: "&E", reference: 1 }
                },
                {
                    line_number: 6,
                    assumption_references: [1],
                    proposition: "C",
                    justification: { name: "&E", reference: 2 }
                },
                {
                    line_number: 7,
                    assumption_references: [1],
                    proposition: "D",
                    justification: { name: "&E", reference: 2 }
                },
                {
                    line_number: { ref: 0 },
                    assumption_references: undefined,
                    proposition: "H",
                    justification: undefined
                }
            ]
        ]
    },
    // 4
    {
        current_problem: {
            using: ["(A & D) → H", "A", "B", "C", "D"],
            derive: "A & D"
        },
        proof_script: {
            root_problem: {
                assumptions: "A & B, C & D, (A & D) → H",
                conclusion: "H"
            },
            tactic_applications: [
                { tactic: "&E", arguments: [0] },
                { tactic: "&E", arguments: [0] },
                { tactic: "→E", arguments: [0] }
            ]
        },
        sub_problem_stack: [
            {
                assumptions: "(A & D) → H, A, B, C, D",
                conclusion: "A & D"
            },
            {
                assumptions: "A, B, C, D, H",
                conclusion: "H"
            }
        ],
        derivation_tree: {
            derivation_type: "Finished",
            problem: {
                assumptions: "A & B, C & D, (A & D) → H",
                conclusion: "H"
            },
            tactic_application: { tactic: "ande", arguments: ["A & B"] },
            sub_derivations: [
                {
                    derivation_type: "Finished",
                    tactic_application: { tactic: "ande", arguments: ["C & D"] },
                    problem: {
                        assumptions: "C & D, (A & D) → H, A, B",
                        conclusion: "H"
                    },
                    sub_derivations: [
                        {
                            derivation_type: "Finished",
                            tactic_application: { tactic: "→E", arguments: ["(A & D) → H"] },
                            problem: {
                                assumptions: "(A & D) → H, A, B, C, D",
                                conclusion: "H"
                            },
                            sub_derivations: [
                                {
                                    derivation_type: "Unfinished",
                                    problem: {
                                        assumptions: "(A & D) → H, A, B, C, D",
                                        conclusion: "A & D"
                                    }
                                },
                                {
                                    derivation_type: "Unfinished",
                                    problem: {
                                        assumptions: "A, B, C, D, H",
                                        conclusion: "H"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        proofs: [
            [
                {
                    line_number: 1,
                    assumption_references: [1],
                    proposition: "A & B",
                    justification: "Premise"
                },
                {
                    line_number: 2,
                    assumption_references: [2],
                    proposition: "C & D",
                    justification: "Premise"
                },
                {
                    line_number: 3,
                    assumption_references: [3],
                    proposition: "(A & D) → H",
                    justification: "Premise"
                },
                {
                    line_number: 4,
                    assumption_references: [1],
                    proposition: "A",
                    justification: { name: "&E", reference: 1 }
                },
                {
                    line_number: 5,
                    assumption_references: [1],
                    proposition: "B",
                    justification: { name: "&E", reference: 1 }
                },
                {
                    line_number: 6,
                    assumption_references: [1],
                    proposition: "C",
                    justification: { name: "&E", reference: 2 }
                },
                {
                    line_number: 7,
                    assumption_references: [1],
                    proposition: "D",
                    justification: { name: "&E", reference: 2 }
                },
                {
                    line_number: { ref: 1 },
                    assumption_references: undefined,
                    proposition: "A & D",
                    justification: undefined
                },
                {
                    line_number: { ref: 0 },
                    assumption_references: undefined,
                    proposition: "H",
                    justification: { name: "→E", major_reference: 3, minor_reference: { ref: 1 } }
                }
            ]
        ]
    },
    // 5
    {
        current_problem: undefined,
        proof_script: {
            root_problem: {
                assumptions: "A & B, C & D, (A & D) → H",
                conclusion: "H"
            },
            tactic_applications: [
                { tactic: "&E", arguments: [0] },
                { tactic: "&E", arguments: [0] },
                { tactic: "→E", arguments: [0] },
                { tactic: "&I", arguments: [] }
            ]
        },
        sub_problem_stack: [],
        derivation_tree: {
            derivation_type: "Finished",
            problem: {
                assumptions: "A & B, C & D, (A & D) → H",
                conclusion: "H"
            },
            tactic_application: { tactic: "ande", arguments: ["A & B"] },
            sub_derivations: [
                {
                    derivation_type: "Finished",
                    tactic_application: { tactic: "ande", arguments: ["C & D"] },
                    problem: {
                        assumptions: "C & D, (A & D) → H, A, B",
                        conclusion: "H"
                    },
                    sub_derivations: [
                        {
                            derivation_type: "Finished",
                            tactic_application: { tactic: "→E", arguments: ["(A & D) → H"] },
                            problem: {
                                assumptions: "(A & D) → H, A, B, C, D",
                                conclusion: "H"
                            },
                            sub_derivations: [
                                {
                                    derivation_type: "Finished",
                                    tactic_application: { tactic: "&I", arguments: [] },
                                    problem: {
                                        assumptions: "(A & D) → H, A, B, C, D",
                                        conclusion: "A & D"
                                    },
                                    sub_derivations: [
                                        {
                                            derivation_type: "Finished",
                                            tactic_application: { tactic: "Close", arguments: [] },
                                            problem: {
                                                assumptions: "(A & D) → H, A, B, C, D",
                                                conclusion: "A"
                                            },
                                            sub_derivations: []
                                        },
                                        {
                                            derivation_type: "Finished",
                                            tactic_application: { tactic: "Close", arguments: [] },
                                            problem: {
                                                assumptions: "(A & D) → H, A, B, C, D",
                                                conclusion: "D"
                                            },
                                            sub_derivations: []
                                        }
                                    ]
                                },
                                {
                                    derivation_type: "Unfinished",
                                    problem: {
                                        assumptions: "A, B, C, D, H",
                                        conclusion: "H"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        proofs: [
            [
                {
                    line_number: 1,
                    assumption_references: [1],
                    proposition: "A & B",
                    justification: "Premise"
                },
                {
                    line_number: 2,
                    assumption_references: [2],
                    proposition: "C & D",
                    justification: "Premise"
                },
                {
                    line_number: 3,
                    assumption_references: [3],
                    proposition: "(A & D) → H",
                    justification: "Premise"
                },
                {
                    line_number: 4,
                    assumption_references: [1],
                    proposition: "A",
                    justification: { name: "&E", reference: 1 }
                },
                {
                    line_number: 5,
                    assumption_references: [2],
                    proposition: "D",
                    justification: { name: "&E", reference: 2 }
                },
                {
                    line_number: 6,
                    assumption_references: [1, 2],
                    proposition: "A & D",
                    justification: { name: "&I", left_reference: 4, right_reference: 5 }
                },
                {
                    line_number: 7,
                    assumption_references: [1, 2, 3],
                    proposition: "H",
                    justification: { name: "→E", major_reference: 3, minor_reference: 6 }
                }
            ]
        ]
    }
]
/*
const and_elimination = (unifying_index?: number): ((frame: InteractionFrame) => InteractionFrame) => {
    const current_problem_from_previous_frame = (frame) => {
        
    }
    const proof_script_from_previous_frame = (frame) => { throw new Error("unimplemented") }
    const sub_problem_stack_from_previous_frame = (frame) => { throw new Error("unimplemented") }
    const derivation_tree_from_previous_frame = (frame) => { throw new Error("unimplemented") }
    const proofs_from_previous_frame = (frame) => { throw new Error("unimplemented") }
    return (frame: InteractionFrame): InteractionFrame => ({
        current_problem: current_problem_from_previous_frame(frame),
        proof_script: proof_script_from_previous_frame(frame),
        sub_problem_stack: sub_problem_stack_from_previous_frame(frame),
        derivation_tree: derivation_tree_from_previous_frame(frame),
        proofs: proofs_from_previous_frame(frame)
    })
}

const and_introduction = () => (frame: InteractionFrame) => {
    throw new Error("unimplemented")
}

const implies_elimination = () => (frame: InteractionFrame) => {
    throw new Error("unimplemented")
}

// isEqual(and_elimination(0)(forbes_42_example_1[0]), forbes_42_example_1[1])
test('step 1', () => expect(and_elimination(0)(forbes_42_example_1[0])).toEqual(forbes_42_example_1[1]))
// // isEqual(and_elimination()(forbes_42_example_1[1]), forbes_42_example_1[2])
// test('step 2', () => expect(and_elimination()(forbes_42_example_1[1])).toEqual(forbes_42_example_1[2]))
// // isEqual(implies_elimination()(forbes_42_example_1[2]), forbes_42_example_1[3])
// test('step 3', () => expect(implies_elimination()(forbes_42_example_1[2])).toEqual(forbes_42_example_1[3]))
// // isEqual(and_introduction()(forbes_42_example_1[3]), forbes_42_example_1[4])
// test('step 4', () => expect(and_introduction()(forbes_42_example_1[3])).toEqual(forbes_42_example_1[4]))
*/