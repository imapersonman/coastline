import { MetaVariable, Variable } from "../../src/lambda_pi/ast";
import { gv, imv, iv, mv, ov } from "../../src/lambda_pi/shorthands";
import { run_tests } from "../utilities";

const pov_tests = [
    ["", ov(""), ov("")],
    ["simple", ov("simple"), ov("simple")],
    ["$", ov("$"), ov("$")],
    ["$_", ov("$_"), ov("$_")],
    ["$_cool", ov("$_cool"), ov("$_cool")],
    ["$something_else", ov("$something_else"), ov("$something_else")],
    ["$something_0", ov("$something_0"), gv("something", 0)],
    ["$else_-1", ov("$else_-1"), gv("else", -1)],
    ["something_2021", ov("something_2021"), ov("something_2021")],
    ["$something_2021", ov("$something_2021"), gv("something", 2021)],
    ["$something-2021", ov("$something-2021"), ov("$something-2021")],
    ["_2021", ov("_2021"), ov("_2021")],
    ["$_1", ov("$_1"), iv(1)],
    ["$_-1202", ov("$_-1202"), iv(-1202)],
]

const pov = (v: Variable): Variable => v.parse()
test("variable parse", () => expect(run_tests(pov, pov_tests)).toEqual([]))

const pmv_tests = [
    ["", mv(""), mv("")],
    ["simple", mv("simple"), mv("simple")],
    ["m", mv("m"), mv("m")],
    ["$cool_122", mv("$cool_122"), mv("$cool_122")],
    ["m_", mv("m_"), mv("m_")],
    ["m_cool", mv("m_cool"), mv("m_cool")],
    ["msomething_else", mv("msomething_else"), mv("msomething_else")],
    ["msomething_0", mv("msomething_0"), mv("msomething_0")],
    ["m_0", mv("m_0"), imv(0)],
    ["m_-12", mv("m_-12"), imv(-12)]
]

const pmv = (v: MetaVariable): MetaVariable => v.parse()
test("meta variable parse", () => expect(run_tests(pmv, pmv_tests)).toEqual([]))