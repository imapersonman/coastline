import { isEqual } from "lodash"
import * as P from "parsimmon"
import { Ast } from "../../../src/lambda_pi/ast"
import { is_atom } from "../../../src/lambda_pi/is_atom"
import { parse_to_ast, parse_to_s } from "../../../src/lambda_pi/parsers/parser"
import { app, clist, con, flapp, la, mv, ov, ovlist, pi, type_k } from "../../../src/lambda_pi/shorthands"
import { syntactic_equality } from "../../../src/lambda_pi/syntactic_equality"
import { ast_to_string, is_application, is_ast, is_constant, is_meta_variable, is_type_kind, is_variable, is_lambda, is_pi } from "../../../src/lambda_pi/utilities"
import { is_array, is_string, last, string_in_array } from "../../../src/utilities"

// I need to rethink aspects of the parser, since the one I was using before was a tad inconsistent.
// The issue lies specifically with identifiers.
// There is currently ambiguity over how to parse the following MetaVariable: ?cool_-12
// The postfix, cool_-12, is a valid Identifier on its own, and it's possible for a MetaVariable not to have an index, so how to we split it up?
// I could have a separate kind of Identifier for Variables and MetaVariables, with MetaVariable ids being more restrictive, but I hate that for some reason -- A tad confusing.
// This would all be fixed if Identifiers couldn't have numbers, or if they couldn't have underscores, but that's absurd.
// It would also be fixed if ?cool was an example of a MetaVariable and $?cool_12 was an example of an IndexedMetaVariable.
// But what is I the sayest, though?
// Another possible fix is just to disallow "?" or "$" in the parser.
// Ye I'll just do that.
type ParserTests = {
    valid: { input: string, output: any, ast: Ast }[],
    invalid: { input: string }[]
}
const ml = (x: Ast): Ast => app(con("ml"), x)
const imp = (x: Ast, y: Ast): Ast => flapp(con("imp"), x, y)
const [x, y, z, A, B, maj, min] = ovlist("x", "y", "z", "A", "B", "maj", "min")
const [a, b, c, o] = clist("a", "b", "c", "o")
const parser_tests: ParserTests =
{
    valid: [
        { input: "Type", output: "Type", ast: type_k },
        { input: " \n\tType  ", output: "Type", ast: type_k },
        { input: "c", output: "c", ast: c },
        { input: "(((((c)))))", output: "c", ast: c },
        { input: "b", output: "b", ast: b },
        { input: "b c", output: ["b", "c"], ast: app(b, c) },
        { input: " \nb   \t\t\t   \n c  ", output: ["b", "c"], ast: app(b, c) },
        { input: "c b", output: ["c", "b"], ast: app(c, b) },
        { input: "(c b) (b c)", output: [["c", "b"], ["b", "c"]], ast: app(app(c, b), app(b, c)) },
        { input: "a b c a", output: [[["a", "b"], "c"], "a"], ast: app(app(app(a, b), c), a) },
        { input: " \n\ta    ballin c    a\nhaulin", output: [[[["a", "ballin"], "c"], "a"], "haulin"], ast: flapp(a, con("ballin"), c, a, con("haulin")) },
        { input: "a (b (c a))", output: ["a", ["b", ["c", "a"]]], ast: app(a, app(b, app(c, a))) },
        // We're just going to pretend cool_-12 is the MetaVariable's identifier.
        { input: "?cool_-12", output: ["?", "cool_-12"], ast: mv("cool_-12") },
        { input: "?beans_4", output: ["?", "beans_4"], ast: mv("beans_4") },
        { input: "?_28", output: ["?", "_28"], ast: mv("_28") },
        { input: "?cool", output: ["?", "cool"], ast: mv("cool") },
        { input: "?beans", output: ["?", "beans"], ast: mv("beans") },
        { input: "a (b c) a", output: [["a", ["b", "c"]], "a"], ast: flapp(a, app(b, c), a) },

        { input: "L(x : Type).c", output: ["λ", "x", "Type", "c"], ast: la(x, type_k, c) },
        { input: "      L    (     x       :       Type )  .   c   ", output: ["λ", "x", "Type", "c"], ast: la(x, type_k, c) },
        { input: "L(x:Type).c", output: ["λ", "x", "Type", "c"], ast: la(x, type_k, c) },
        { input: "L(awesome:sauce).c", output: ["λ", "awesome", "sauce", "c"], ast: la(ov("awesome"), con("sauce"), c) },

        { input: "P(x : Type).c", output: ["∏", "x", "Type", "c"], ast: pi(x, type_k, c) },
        { input: "      P    (     x       :       Type )  .   c   ", output: ["∏", "x", "Type", "c"], ast: pi(x, type_k, c) },
        { input: "P(x:Type).c", output: ["∏", "x", "Type", "c"], ast: pi(x, type_k, c) },
        { input: "P(awesome:sauce).c", output: ["∏", "awesome", "sauce", "c"], ast: pi(ov("awesome"), con("sauce"), c) },

        { input: "λ(x : Type).c", output: ["λ", "x", "Type", "c"], ast: la(x, type_k, c) },
        { input: "      λ    (     x       :       Type )  .   c   ", output: ["λ", "x", "Type", "c"], ast: la(x, type_k, c) },
        { input: "λ(x:Type).c", output: ["λ", "x", "Type", "c"], ast: la(x, type_k, c) },
        { input: "λ(awesome:sauce).c", output: ["λ", "awesome", "sauce", "c"], ast: la(ov("awesome"), con("sauce"), c) },

        { input: "∏(x : Type).c", output: ["∏", "x", "Type", "c"], ast: pi(x, type_k, c) },
        { input: "      ∏    (     x       :       Type )  .   c   ", output: ["∏", "x", "Type", "c"], ast: pi(x, type_k, c) },
        { input: "∏(x:Type).c", output: ["∏", "x", "Type", "c"], ast: pi(x, type_k, c) },
        { input: "∏(awesome:sauce).c", output: ["∏", "awesome", "sauce", "c"], ast: pi(ov("awesome"), con("sauce"), c) },

        { input: "L(x : L(x : Type).y).L(y : x).Type", output: ["λ", "x", ["λ", "x", "Type", "y"], ["λ", "y", "x", "Type"]], ast: la(ov("x"), la(ov("x"), type_k, con("y")), la(ov("y"), ov("x"), type_k)) },
        { input: "L(x : L(x : x).Type).L(x : Type).c", output: ["λ", "x", ["λ", "x", "x", "Type"], ["λ", "x", "Type", "c"]], ast: la(ov("x"), la(ov("x"), con("x"), type_k), la(ov("x"), type_k, c)) },
        { input: "(L(x: b).x) x", output: [["λ", "x", "b", "x"], "x"], ast: app(la(ov("x"), con("b"), ov("x")), con("x")) },

        {
            input: "(L(x: a).L(y: b).x y z) (L(y: a).L(z: b).x y z)",
            output: [["λ", "x", "a", ["λ", "y", "b", [["x", "y"], "z"]]], ["λ", "y", "a", ["λ", "z", "b", [["x", "y"], "z"]]]],
            ast: app(la(x, a, la(y, b, flapp(x, y, con("z")))), la(y, a, la(z, b, flapp(con("x"), y, z))))
        },

        {
            input: "P(A: o).P(B: o).P(maj: ml (imp A B)).P(min: ml A).ml B",
            output: ["∏", "A", "o", ["∏", "B", "o", ["∏", "maj", ["ml", [["imp", "A"], "B"]], ["∏", "min", ["ml", "A"], ["ml", "B"]]]]],
            ast: pi(A, o, pi(B, o, pi(maj, ml(imp(A, B)), pi(min, ml(A), ml(B)))))
        },
        /*
        P(A: o).P(if: P(a: i).ml(A)).ml(A)
        {
            output: ["∏", "A", "o", ["∏", "if", [], ["ml", "A"]]]
        }
        */
    ],
    invalid: [
        // We regularly parse Variable Ids internally inside RecursiveMaps (dumb but "legacy") but only under the assumption that GeneratedVariables cannot
        // come from the outside world, so anything that can be parsed as a GeneratedVariable must be rejected by the parser.
        { input: "$cool_-12" },
        { input: "$cool_beans_-12" },
        { input: "$beans_4" },
        { input: "$_28" },
        { input: "?" },
        { input: "" },
        { input: "ml(A)" },
        { input: "P(A: o).P(if: P(a: i).ml(A)).ml(A)" },
    ]
}

const descriptive_ast_to_string = (ast: Ast): string => {
    if (is_constant(ast))
        return ast.id
    if (is_variable(ast))
        return `[${ast.id}]`
    if (is_meta_variable(ast))
        return `?${ast.id}`
    if (is_application(ast)) {
        if (is_application(ast.head))
            return `${descriptive_ast_to_string(ast.head)} ${descriptive_ast_to_string(ast.arg)}`
        return `${to_factored_string(ast.head)} ${to_factored_string(ast.arg)}`
    }
    if (is_lambda(ast))
        return `λ(${descriptive_ast_to_string(ast.bound)}: ${descriptive_ast_to_string(ast.type)}).${descriptive_ast_to_string(ast.scope)}`
    if (is_pi(ast))
        return `Π(${descriptive_ast_to_string(ast.bound)}: ${descriptive_ast_to_string(ast.type)}).${descriptive_ast_to_string(ast.scope)}`
    if (is_type_kind(ast))
        return "Type"
    throw new Error("Can't convert unknown Ast to string")
}

function to_factored_string(ast: Ast): string {
    if (is_atom(ast))
        return ast_to_string(ast)
    return `(${ast_to_string(ast)})`
}

const generate_tested_parser = (parse_to_s_f: (input: string) => any, parse_to_ast_f: (input: any) => Ast | undefined, tests: ParserTests): any => {
    return {
        valid: tests.valid.map(({ input, output, ast }) => {
            const result = parse_to_s_f(input)
            if (result.status === false)
                return {
                    input,
                    expected: output,
                    error: result,
                    result: "FAILED_TO_S"
                }
            if (!isEqual(result.value, output))
                return {
                    input,
                    expected: output,
                    actual: result.value,
                    result: "FAILED_TO_S"
                }
            const ast_result = parse_to_ast_f(result.value)
            if (ast_result === undefined || !syntactic_equality(ast_result, ast))
                return {
                    input,
                    expected: is_ast(ast) ? descriptive_ast_to_string(ast) : `NOT AN AST: ${JSON.stringify(ast)}`,
                    actual: is_ast(ast_result) ? descriptive_ast_to_string(ast_result) : JSON.stringify(ast_result),
                    result: "FAILED_TO_AST"
                }
            return { input, result: "PASSED" }
        }),
        invalid: tests.invalid.map(({ input }) => {
            const result = parse_to_s_f(input)
            if (result.status !== false)
                return {
                    input,
                    result: "FAILED_WITHOUT_ERROR",
                    actual: result.value
                }
            return { input, result: "PASSED" }
        })
    }
}

const generate_successful_parser_test = (tests: ParserTests): any => {
    return {
        valid: parser_tests.valid.map(({ input }) => ({ input, result: "PASSED" })),
        invalid: parser_tests.invalid.map(({ input }) => ({ input, result: "PASSED" }))
    }
}

test("lambda pi parser", () => expect(
    generate_tested_parser(parse_to_s, parse_to_ast, parser_tests)
).toEqual(
    generate_successful_parser_test(parser_tests)
))