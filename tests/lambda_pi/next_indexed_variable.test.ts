import { app, con, gv, iv, la, ov, pi, type_k } from "../../src/lambda_pi/shorthands";
import { next_indexed_variable } from "../../src/lambda_pi/next_indexed_variable";
import { run_tests } from "../utilities";

export const next_indexed_variable_tests = [
    ["Type", type_k, iv(0)],
    ["constant", con("a"), iv(0)],
    ["variable", ov("b"), iv(0)],
    ["indexed variable 10", iv(10), iv(11)],
    ["indexed variable -11", iv(-11), iv(-10)],
    ["indexed variable -1", iv(-1), iv(0)],
    ["generated variable 11", gv("cool", 11), iv(0)],
    ["app none", app(con("some"), ov("thing")), iv(0)],
    ["app some", app(con("else"), iv(31)), iv(32)],
    ["deep app compare", app(app(con("some"), iv(-12)), app(iv(12), con("some"))), iv(13)],
    ["la none", la(ov("x"), type_k, con("y")), iv(0)],
    ["la some", la(ov("y"), iv(31), type_k), iv(32)],
    ["la bound compare", la(iv(31), ov("a"), iv(9)), iv(32)],
    ["deep la compare", la(ov("k"), la(iv(-7), type_k, type_k), la(ov("k"), iv(-14), type_k)), iv(0)],
    ["pi none", pi(ov("x"), type_k, con("y")), iv(0)],
    ["pi some", pi(ov("y"), iv(31), type_k), iv(32)],
    ["pi bound compare", pi(iv(31), ov("a"), iv(9)), iv(32)],
    ["deep pi compare", pi(iv(-16), pi(iv(-14), type_k, type_k), pi(ov("nah"), iv(2), type_k)), iv(3)]
]

test("next_indexed_variable", () => expect(run_tests(next_indexed_variable, next_indexed_variable_tests)).toEqual([]))