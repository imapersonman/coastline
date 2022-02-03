import { ast_pos, first_position_at_ast, get_ast_at, replace_ast_at } from "../../src/lambda_pi/position";
import { app, con, la, mv, ov, ovlist, pi, type_k } from "../../src/lambda_pi/shorthands";

describe("get_ast_at", () => {
    test("Type", () => expect(
        get_ast_at(type_k, ast_pos())
    ).toEqual(
        type_k
    ))
    test("get at 0th child position in Type", () => expect(
        get_ast_at(type_k, ast_pos(0))
    ).toEqual(
        undefined
    ))
    test("get at root child position in Variable", () => expect(
        get_ast_at(ov("a"), ast_pos())
    ).toEqual(
        ov("a")
    ))
    test("get at 0th child position in Variable", () => expect(
        get_ast_at(ov("a"), ast_pos(0))
    ).toEqual(
        undefined
    ))
    test("get at root child position in Constant", () => expect(
        get_ast_at(con("a"), ast_pos())
    ).toEqual(
        con("a")
    ))
    test("get at 0th child position in Constant", () => expect(
        get_ast_at(con("a"), ast_pos(0))
    ).toEqual(
        undefined
    ))
    test("get at root child position in MetaVariable", () => expect(
        get_ast_at(mv("A"), ast_pos())
    ).toEqual(
        mv("A")
    ))
    test("get at 0th child position in MetaVariable", () => expect(
        get_ast_at(mv("A"), ast_pos(0))
    ).toEqual(
        undefined
    ))
    test("get at root child position in Application", () => expect(
        get_ast_at(app(con("a"), ov("x")), ast_pos())
    ).toEqual(
        app(con("a"), ov("x"))
    ))
    test("get at 0th child position in Application", () => expect(
        get_ast_at(app(con("a"), ov("x")), ast_pos(0))
    ).toEqual(
        con("a")
    ))
    test("get at 1st child position in Application", () => expect(
        get_ast_at(app(con("a"), ov("x")), ast_pos(1))
    ).toEqual(
        ov("x")
    ))
    test("get at 2nd child position in Application", () => expect(
        get_ast_at(app(con("a"), ov("x")), ast_pos(2))
    ).toEqual(
        undefined
    ))
    test("get at [0, 0] child position in Application", () => expect(
        get_ast_at(app(con("a"), ov("x")), ast_pos(0, 0))
    ).toEqual(
        undefined
    ))
    test("get at [1, 0] child position in Application", () => expect(
        get_ast_at(app(con("a"), ov("x")), ast_pos(1, 0))
    ).toEqual(
        undefined
    ))
    test("get at root child position in Lambda", () => expect(
        get_ast_at(la(ov("x"), ov("y"), ov("z")), ast_pos())
    ).toEqual(
        la(ov("x"), ov("y"), ov("z"))
    ))
    test("get at 0th child position in Lambda", () => expect(
        get_ast_at(la(ov("x"), ov("y"), ov("z")), ast_pos(0))
    ).toEqual(
        ov("y")
    ))
    test("get at 1st child position in Lambda", () => expect(
        get_ast_at(la(ov("x"), ov("y"), ov("z")), ast_pos(1))
    ).toEqual(
        ov("z")
    ))
    test("get at 2nd child position in Lambda", () => expect(
        get_ast_at(la(ov("x"), ov("y"), ov("z")), ast_pos(2))
    ).toEqual(
        undefined
    ))
    test("get at [0, 0] child position in Lambda", () => expect(
        get_ast_at(la(ov("x"), ov("y"), ov("z")), ast_pos(0, 0))
    ).toEqual(
        undefined
    ))
    test("get at [1, 0] child position in Lambda", () => expect(
        get_ast_at(la(ov("x"), ov("y"), ov("z")), ast_pos(1, 0))
    ).toEqual(
        undefined
    ))
    test("get at root child position in Pi", () => expect(
        get_ast_at(pi(ov("x"), ov("y"), ov("z")), ast_pos())
    ).toEqual(
        pi(ov("x"), ov("y"), ov("z"))
    ))
    test("get at 0th child position in Pi", () => expect(
        get_ast_at(pi(ov("x"), ov("y"), ov("z")), ast_pos(0))
    ).toEqual(
        ov("y")
    ))
    test("get at 1st child position in Pi", () => expect(
        get_ast_at(pi(ov("x"), ov("y"), ov("z")), ast_pos(1))
    ).toEqual(
        ov("z")
    ))
    test("get at 2nd child position in Pi", () => expect(
        get_ast_at(pi(ov("x"), ov("y"), ov("z")), ast_pos(2))
    ).toEqual(
        undefined
    ))
    test("get at [0, 0] child position in Pi", () => expect(
        get_ast_at(pi(ov("x"), ov("y"), ov("z")), ast_pos(0, 0))
    ).toEqual(
        undefined
    ))
    test("get at [1, 0] child position in Pi", () => expect(
        get_ast_at(pi(ov("x"), ov("y"), ov("z")), ast_pos(1, 0))
    ).toEqual(
        undefined
    ))
    test("a bit deeper", () => expect(
        get_ast_at(app(app(la(ov("x"), con("y"), ov("z")), type_k), app(type_k, pi(ov("a"), con("b"), ov("c")))), ast_pos(1, 1, 1))
    ).toEqual(
        ov("c")
    ))
    test("a bit deeper but not too deep", () => expect(
        get_ast_at(app(app(la(ov("x"), con("y"), ov("z")), type_k), app(type_k, pi(ov("a"), con("b"), ov("c")))), ast_pos(1, 1))
    ).toEqual(
        pi(ov("a"), con("b"), ov("c"))
    ))
    test("asymmetric to make sure the position's order is taken correctly", () => expect(
        get_ast_at(app(app(la(ov("x"), con("y"), ov("z")), type_k), app(ov("x"), pi(ov("a"), con("b"), ov("c")))), ast_pos(0, 1))
    ).toEqual(
        type_k
    ))
})

describe("replace_ast_at", () => {
    test("root position in Type", () => expect(
        replace_ast_at(type_k, ast_pos(), ov("x"))
    ).toEqual(
        ov("x")
    ))
    test("0th child position in Type", () => expect(
        replace_ast_at(type_k, ast_pos(0), ov("x"))
    ).toEqual(
        type_k
    ))
    test("root child position in Variable", () => expect(
        replace_ast_at(ov("a"), ast_pos(), app(ov("x"), ov("y")))
    ).toEqual(
        app(ov("x"), ov("y"))
    ))
    test("0th child position in Variable", () => expect(
        replace_ast_at(ov("a"), ast_pos(0), type_k)
    ).toEqual(
        ov("a")
    ))
    test("root child position in Constant", () => expect(
        replace_ast_at(con("a"), ast_pos(), type_k)
    ).toEqual(
        type_k
    ))
    test("0th child position in Constant", () => expect(
        replace_ast_at(con("a"), ast_pos(0), pi(ov("A"), con("B"), con("C")))
    ).toEqual(
        con("a")
    ))
    test("root child position in MetaVariable", () => expect(
        replace_ast_at(mv("A"), ast_pos(), con("a"))
    ).toEqual(
        con("a")
    ))
    test("0th child position in MetaVariable", () => expect(
        replace_ast_at(mv("A"), ast_pos(0), con("a"))
    ).toEqual(
        mv("A")
    ))
    test("root child position in Application", () => expect(
        replace_ast_at(app(con("a"), ov("x")), ast_pos(), ov("x"))
    ).toEqual(
        ov("x")
    ))
    // first interesting test :(
    test("0th child position in Application", () => expect(
        replace_ast_at(app(con("a"), ov("x")), ast_pos(0), ov("x"))
    ).toEqual(
        app(ov("x"), ov("x"))
    ))
    test("1st child position in Application", () => expect(
        replace_ast_at(app(con("a"), ov("x")), ast_pos(1), ov("y"))
    ).toEqual(
        app(con("a"), ov("y"))
    ))
    test("2nd child position in Application", () => expect(
        replace_ast_at(app(con("a"), ov("x")), ast_pos(2), con("b"))
    ).toEqual(
        app(con("a"), ov("x"))
    ))
    test("[0, 0] child position in Application", () => expect(
        replace_ast_at(app(con("a"), ov("x")), ast_pos(0, 0), con("b"))
    ).toEqual(
        app(con("a"), ov("x"))
    ))
    test("[1, 0] child position in Application", () => expect(
        replace_ast_at(app(con("a"), ov("x")), ast_pos(1, 0), con("b"))
    ).toEqual(
        app(con("a"), ov("x"))
    ))
    test("root child position in Lambda", () => expect(
        replace_ast_at(la(ov("x"), ov("y"), ov("z")), ast_pos(), ov("x"))
    ).toEqual(
        ov("x")
    ))
    test("0th child position in Lambda", () => expect(
        replace_ast_at(la(ov("x"), ov("y"), ov("z")), ast_pos(0), mv("X"))
    ).toEqual(
        la(ov("x"), mv("X"), ov("z"))
    ))
    test("1st child position in Lambda", () => expect(
        replace_ast_at(la(ov("x"), ov("y"), ov("z")), ast_pos(1), app(ov("y"), ov("x")))
    ).toEqual(
        la(ov("x"), ov("y"), app(ov("y"), ov("x")))
    ))
    test("2nd child position in Lambda", () => expect(
        replace_ast_at(la(ov("x"), ov("y"), ov("z")), ast_pos(2), type_k)
    ).toEqual(
        la(ov("x"), ov("y"), ov("z"))
    ))
    test("[0, 0] child position in Lambda", () => expect(
        replace_ast_at(la(ov("x"), ov("y"), ov("z")), ast_pos(0, 0), ov("x"))
    ).toEqual(
        la(ov("x"), ov("y"), ov("z"))
    ))
    test("[1, 0] child position in Lambda", () => expect(
        replace_ast_at(la(ov("x"), ov("y"), ov("z")), ast_pos(1, 0), type_k)
    ).toEqual(
        la(ov("x"), ov("y"), ov("z"))
    ))

    test("root child position in Pi", () => expect(
        replace_ast_at(pi(ov("x"), ov("y"), ov("z")), ast_pos(), ov("x"))
    ).toEqual(
        ov("x")
    ))
    test("0th child position in Pi", () => expect(
        replace_ast_at(pi(ov("x"), ov("y"), ov("z")), ast_pos(0), mv("X"))
    ).toEqual(
        pi(ov("x"), mv("X"), ov("z"))
    ))
    test("1st child position in Pi", () => expect(
        replace_ast_at(pi(ov("x"), ov("y"), ov("z")), ast_pos(1), app(ov("y"), ov("x")))
    ).toEqual(
        pi(ov("x"), ov("y"), app(ov("y"), ov("x")))
    ))
    test("2nd child position in Pi", () => expect(
        replace_ast_at(pi(ov("x"), ov("y"), ov("z")), ast_pos(2), type_k)
    ).toEqual(
        pi(ov("x"), ov("y"), ov("z"))
    ))
    test("[0, 0] child position in Pi", () => expect(
        replace_ast_at(pi(ov("x"), ov("y"), ov("z")), ast_pos(0, 0), ov("x"))
    ).toEqual(
        pi(ov("x"), ov("y"), ov("z"))
    ))
    test("[1, 0] child position in Pi", () => expect(
        replace_ast_at(pi(ov("x"), ov("y"), ov("z")), ast_pos(1, 0), type_k)
    ).toEqual(
        pi(ov("x"), ov("y"), ov("z"))
    ))
    test("a bit deeper", () => expect(
        replace_ast_at(app(app(la(ov("x"), con("y"), ov("z")), type_k), app(type_k, pi(ov("a"), con("b"), ov("c")))), ast_pos(1, 1, 1), type_k)
    ).toEqual(
        app(app(la(ov("x"), con("y"), ov("z")), type_k), app(type_k, pi(ov("a"), con("b"), type_k)))
    ))
    test("a bit deeper but not too deep", () => expect(
        replace_ast_at(app(app(la(ov("x"), con("y"), ov("z")), type_k), app(type_k, pi(ov("a"), con("b"), ov("c")))), ast_pos(1, 1), type_k)
    ).toEqual(
        app(app(la(ov("x"), con("y"), ov("z")), type_k), app(type_k, type_k))
    ))
    test("asymmetric to make sure the position's order is taken correctly", () => expect(
        replace_ast_at(app(app(la(ov("x"), con("y"), ov("z")), type_k), app(ov("x"), pi(ov("a"), con("b"), ov("c")))), ast_pos(0, 1), ov("y"))
    ).toEqual(
        app(app(la(ov("x"), con("y"), ov("z")), ov("y")), app(ov("x"), pi(ov("a"), con("b"), ov("c"))))
    ))
})

describe('first_position_at_ast', () => {
    // atoms fall under one case, so I'll only really test the recursive Asts.
    const [a, b, c] = ovlist('a', 'b', 'c')
    test('root: type_k, finds self', () => expect(first_position_at_ast(type_k, type_k)).toEqual(ast_pos()))
    test('root: type_k, cannot find', () => expect(first_position_at_ast(type_k, a)).toEqual(undefined))
    test('root: a b, finds self', () => expect(first_position_at_ast(app(a, b), app(a, b))).toEqual(ast_pos()))
    test('root: a b, finds head', () => expect(first_position_at_ast(app(a, b), a)).toEqual(ast_pos(0)))
    test('root: a b, finds arg', () => expect(first_position_at_ast(app(a, b), b)).toEqual(ast_pos(1)))
    test('root: a b, cannot find', () => expect(first_position_at_ast(app(a, b), c)).toEqual(undefined))
    // assuming we're using is_binder so there's no use testing the above for pi types.
    test('root: L(a: b).c, looking for a because cannot find it (ignores bound)', () => expect(first_position_at_ast(la(a, b, c), a)).toEqual(undefined))
    test('root: L(a: b).c, find self ', () => expect(first_position_at_ast(la(a, b, c), la(a, b, c))).toEqual(ast_pos()))
    test('root: L(a: b).c, find type', () => expect(first_position_at_ast(la(a, b, c), b)).toEqual(ast_pos(0)))
    test('root: L(a: b).c, find scope', () => expect(first_position_at_ast(la(a, b, c), c)).toEqual(ast_pos(1)))
    test('root: L(a: b).c, cannot find', () => expect(first_position_at_ast(la(a, b, c), type_k)).toEqual(undefined))
    // just one non-trivial test cuz I'm tired.
    test('root: L(a: (a b)).b a', () => expect(first_position_at_ast(la(a, app(a, b), app(b, a)), b)).toEqual(ast_pos(0, 1)))
})