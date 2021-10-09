import { defined, is_array, is_empty, is_string, last, string_in_array } from "../../utilities"
import * as P from "parsimmon"
import { Ast } from "../ast"
import { app, con, la, mv, ov, pi, type_k } from "../shorthands"

const lambda_pi = P.createLanguage({
    Expression: (r) => P.alt(r.Pi, r.Lambda/*, r.Abstraction*/, r.Application, r.Factor).trim(P.optWhitespace),
    Type: (r) => P.string("Type"),
    MetaVariable: (r) => P.seq(P.string("?"), r.Identifier),
    Identifier: (r) => P.regexp(/([A-Za-z_\-])[A-Za-z0-9_$\-]*/),
    Factor: (r) => P.alt(
        r.Type,
        r.Identifier,
        r.MetaVariable,
        r.Expression.wrap(P.string("("), P.string(")"))
    ),
    Application: (r) => r.Factor.sepBy(P.whitespace).assert((a) => a.length >= 2).map((a) => {
        const associate = (a) => a.length === 2 ? a : [associate(a.slice(0, -1)), last(a)]
        return associate(a)
    }),
    Pi:     (r) => P.seq(P.alt(P.string("P"), P.string("∏")).skip(P.optWhitespace), r.Abstraction).map(([,abstraction]) => ["∏", ...abstraction]),
    Lambda: (r) => P.seq(P.alt(P.string("L"), P.string("λ")).skip(P.optWhitespace), r.Abstraction).map(([,abstraction]) => ["λ", ...abstraction]),
    Abstraction: (r) => P.seq(
        P.seq(
            r.Identifier.skip(P.optWhitespace).skip(P.string(":")).skip(P.optWhitespace),
            r.Expression
        ).wrap(
            P.string("(").then(P.optWhitespace),
            P.optWhitespace.then(P.string(")"))
        ).skip(P.optWhitespace).skip(P.string(".")),
        r.Expression
    ).map(([[id, type], scope]) => [id, type, scope])
})

export const parse_to_s = (input: string): any => lambda_pi.Expression.parse(input)

export const parse_to_ast = (input: any): Ast | undefined => {
    const parse = (ids: string[], input: any): Ast | undefined => {
        if (typeof input === "string") {
            if (input === "Type")
                return type_k
            if (string_in_array(ids, input))
                return ov(input)
            return con(input)
        } else if (is_array(input)) {
            if (input.length === 2) {
                if (input[0] === "?" && is_string(input[1]))
                    return mv(input[1])
                const first = parse(ids, input[0])
                if (first === undefined)
                    return undefined
                const second = parse(ids, input[1])
                if (second === undefined)
                    return undefined
                return app(first, second)
            } else if (input.length === 4) {
                if (typeof input[1] !== "string")
                    return undefined
                const x = ov(input[1])
                const type = parse(ids, input[2])
                if (type === undefined)
                    return undefined
                const scope = parse([x.id, ...ids], input[3])
                if (scope === undefined)
                    return undefined
                if (input[0] === "∏")
                    return pi(x, type, scope)
                if (input[0] === "λ")
                    return la(x, type, scope)
                return undefined
            }
            return undefined
        }
        return undefined
    }
    return parse([], input)
}

export const parse = (input: string): Ast | undefined => {
    const result = parse_to_s(input)
    return defined(result.value) ? parse_to_ast(result.value) : undefined
}

export const try_parse = (input: string): Ast => {
    const ast = parse(input)
    if (ast === undefined)
        throw new Error(`Unable to parse ${input}`)
    return ast
}

