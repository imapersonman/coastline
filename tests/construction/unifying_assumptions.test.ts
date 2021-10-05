import { mk_map } from "../../src/map/RecursiveMap"
import { unifying_assumption, find_unifying_assumptions } from "../../src/construction/unifying_assumptions"
import { iv, mvlist, ov, ovlist, type_k, flapp, app, con } from "../../src/lambda_pi/shorthands"
import { run_tests } from "../utilities"
import { Ast } from "../../src/lambda_pi/ast"

const [and, ml, o] = [(x: Ast, y: Ast): Ast => flapp(con("and"), x, y), (x: Ast): Ast => app(con("ml"), x), con("o")]
const [A, B] = ovlist("A", "B")
const [X, Y] = mvlist("X", "Y")

// Write a bunch of find_unifying_assumptions tests where variable ids are properly parsed.
const find_unifying_assumptions_tests = [
    ["empty", mk_map(), ml(A), []],
    ["non-empty no match", mk_map(["cool", ml(B)]), type_k, []],
    ["one element match", mk_map(["cool", ml(B)]), ml(X), [unifying_assumption({ "X": B }, ov("cool"))]],
    ["one element match parse", mk_map(["$_-12", ml(B)]), ml(X), [unifying_assumption({ "X": B }, iv(-12))]],
    [
        "5 elements 1 match some parsed",
        mk_map<Ast>(["A", o], ["B", o], [iv(0).id, ml(and(A, B))], ["c", ml(and(B, A))], [iv(2).id, ml(and(B, B))]),
        ml(and(X, Y)),
        [unifying_assumption({ "X": A, "Y": B }, iv(0)), unifying_assumption({ "X": B, "Y": A }, ov("c")), unifying_assumption({ "X": B, "Y": B }, iv(2))]
    ]
]

test("unifying_assumptions", () => expect(run_tests(find_unifying_assumptions, find_unifying_assumptions_tests)).toEqual([]))