import { Ast } from "../../src/lambda_pi/ast";
import { occs } from "../../src/lambda_pi/occs";
import { app, con, la, mv, ov, pi, type_k } from "../../src/lambda_pi/shorthands";

const test_occs = (n: string, er: Ast, ee: Ast, out: number) => test(`occs ${n}`, () => expect(occs(er, ee)).toEqual(out))

test_occs("Type", type_k, type_k, 1)
test_occs("Constant", con("a"), con("a"), 1)
test_occs("Variable", ov("a"), ov("a"), 1)
test_occs("MetaVariable", mv("a"), mv("a"), 1)
test_occs("different MetaVariable", mv("a"), mv("b"), 0)

test_occs("Application 0", app(ov("a"), ov("a")), ov("b"), 0)
test_occs("Application 1", app(ov("a"), app(ov("a"), ov("b"))), ov("b"), 1)
test_occs("Application 2", app(ov("b"), app(ov("a"), ov("b"))), ov("b"), 2)
test_occs("Application 3", app(ov("b"), app(ov("b"), ov("b"))), ov("b"), 3)
test_occs("Application in Application 1", app(ov("b"), app(ov("b"), ov("b"))), app(ov("b"), ov("b")), 1)

test_occs("Lambda 0", la(ov("b"), ov("b"), ov("b")), ov("b"), 0)
test_occs("Lambda 1", la(ov("a"), ov("b"), type_k), ov("b"), 1)
test_occs("Lambda 2", la(ov("a"), la(ov("x"), ov("b"), ov("x")), la(ov("y"), ov("x"), ov("b"))), ov("b"), 2)
test_occs("Lambda in Lambda 1", la(ov("a"), la(ov("x"), ov("b"), ov("x")), la(ov("y"), ov("x"), ov("b"))), la(ov("y"), ov("x"), ov("b")), 1)

test_occs("Pi 0", pi(ov("b"), ov("b"), ov("b")), ov("b"), 0)
test_occs("Pi 1", pi(ov("a"), ov("b"), type_k), ov("b"), 1)
test_occs("Pi 2", pi(ov("a"), pi(ov("x"), ov("b"), ov("x")), pi(ov("y"), ov("x"), ov("b"))), ov("b"), 2)
test_occs("Pi in Pi 1", pi(ov("a"), pi(ov("x"), ov("b"), ov("x")), pi(ov("y"), ov("x"), ov("b"))), pi(ov("y"), ov("x"), ov("b")), 1)