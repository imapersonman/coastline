import { Application, Ast, Constant, GeneratedVariable, Lambda, MetaVariable, Pi, TypeKind, Variable } from "../../lambda_pi/ast";
import { is_generated_variable } from "../../lambda_pi/utilities";
const peg_parse = require("./lambda_pi_generated_parser").parse

export class ParseError { constructor(readonly input: string, readonly msg: string) {} }

type ParseTree =
    | { type: "TypeKind" }
    | { type: "Constant", id: string }
    | { type: "Variable", id: string }
    | { type: "VarConst", id: string }
    | { type: "Application", head: ParseTree, arg: ParseTree }
    | { type: "Lambda", b: string, t: ParseTree, s: ParseTree }
    | { type: "Pi", b: string, t: ParseTree, s: ParseTree }
    | { type: "MetaVariable", id: string }
    | { type: "GeneratedVariable", base: string, index: number }

function parse_to_parse_tree(input: string): ParseTree | ParseError {
    try {
        return peg_parse(input)
    } catch (error: any) {
        return new ParseError(input, error.message)
    }
}

export function safe_parse(input: string): Ast {
    const parsed = parse(input)
    if (parsed instanceof ParseError)
        throw new Error(parsed.msg)
    return parsed
}

export function parse(input: string): Ast | ParseError {
    const pt = parse_to_parse_tree(input)
    if (pt instanceof ParseError)
        return pt
    return to_ast(pt)
}

export function to_ast(pt: ParseTree): Ast {
    const contains_string = (arr: string[], str: string) => arr.some((el) => el === str)
    const add_string = (arr: string[], str: string) => [...arr, str]
    const to_ast_acc = (ids: string[], pt: ParseTree): Ast => {
        const ret = pt.type === "TypeKind" ? new TypeKind
        : pt.type === "VarConst" && !contains_string(ids, pt.id) && !is_generated_variable(new Variable(pt.id).parse()) ? new Constant(pt.id)
        : pt.type === "VarConst" && !contains_string(ids, pt.id) ? new Variable(pt.id).parse()
        : pt.type === "VarConst" && contains_string(ids, pt.id) ? new Variable(pt.id)
        : pt.type === "MetaVariable" ? new MetaVariable(pt.id)
        : pt.type === "Application" ? new Application(to_ast_acc(ids, pt.head), to_ast_acc(ids, pt.arg))
        : pt.type === "Lambda" ? new Lambda(
            new Variable(pt.b).parse(),
            to_ast_acc(ids, pt.t),
            to_ast_acc(add_string(ids, pt.b), pt.s))
        : pt.type === "Pi" ? new Pi(
            new Variable(pt.b).parse(),
            to_ast_acc(ids, pt.t),
            to_ast_acc(add_string(ids, pt.b), pt.s))
        : undefined
        if (ret === undefined)
            throw new Error("Unrecognized ParseTree")
        return ret
    }
    return to_ast_acc([], pt)
}