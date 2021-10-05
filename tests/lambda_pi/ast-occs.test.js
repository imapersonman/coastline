"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const occs_1 = require("../../src/lambda_pi/occs");
const shorthands_1 = require("../../src/lambda_pi/shorthands");
const test_occs = (n, er, ee, out) => test(`occs ${n}`, () => expect((0, occs_1.occs)(er, ee)).toEqual(out));
test_occs("Type", shorthands_1.type_k, shorthands_1.type_k, 1);
test_occs("Constant", (0, shorthands_1.con)("a"), (0, shorthands_1.con)("a"), 1);
test_occs("Variable", (0, shorthands_1.ov)("a"), (0, shorthands_1.ov)("a"), 1);
test_occs("MetaVariable", (0, shorthands_1.mv)("a"), (0, shorthands_1.mv)("a"), 1);
test_occs("different MetaVariable", (0, shorthands_1.mv)("a"), (0, shorthands_1.mv)("b"), 0);
test_occs("Application 0", (0, shorthands_1.app)((0, shorthands_1.ov)("a"), (0, shorthands_1.ov)("a")), (0, shorthands_1.ov)("b"), 0);
test_occs("Application 1", (0, shorthands_1.app)((0, shorthands_1.ov)("a"), (0, shorthands_1.app)((0, shorthands_1.ov)("a"), (0, shorthands_1.ov)("b"))), (0, shorthands_1.ov)("b"), 1);
test_occs("Application 2", (0, shorthands_1.app)((0, shorthands_1.ov)("b"), (0, shorthands_1.app)((0, shorthands_1.ov)("a"), (0, shorthands_1.ov)("b"))), (0, shorthands_1.ov)("b"), 2);
test_occs("Application 3", (0, shorthands_1.app)((0, shorthands_1.ov)("b"), (0, shorthands_1.app)((0, shorthands_1.ov)("b"), (0, shorthands_1.ov)("b"))), (0, shorthands_1.ov)("b"), 3);
test_occs("Application in Application 1", (0, shorthands_1.app)((0, shorthands_1.ov)("b"), (0, shorthands_1.app)((0, shorthands_1.ov)("b"), (0, shorthands_1.ov)("b"))), (0, shorthands_1.app)((0, shorthands_1.ov)("b"), (0, shorthands_1.ov)("b")), 1);
test_occs("Lambda 0", (0, shorthands_1.la)((0, shorthands_1.ov)("b"), (0, shorthands_1.ov)("b"), (0, shorthands_1.ov)("b")), (0, shorthands_1.ov)("b"), 0);
test_occs("Lambda 1", (0, shorthands_1.la)((0, shorthands_1.ov)("a"), (0, shorthands_1.ov)("b"), shorthands_1.type_k), (0, shorthands_1.ov)("b"), 1);
test_occs("Lambda 2", (0, shorthands_1.la)((0, shorthands_1.ov)("a"), (0, shorthands_1.la)((0, shorthands_1.ov)("x"), (0, shorthands_1.ov)("b"), (0, shorthands_1.ov)("x")), (0, shorthands_1.la)((0, shorthands_1.ov)("y"), (0, shorthands_1.ov)("x"), (0, shorthands_1.ov)("b"))), (0, shorthands_1.ov)("b"), 2);
test_occs("Lambda in Lambda 1", (0, shorthands_1.la)((0, shorthands_1.ov)("a"), (0, shorthands_1.la)((0, shorthands_1.ov)("x"), (0, shorthands_1.ov)("b"), (0, shorthands_1.ov)("x")), (0, shorthands_1.la)((0, shorthands_1.ov)("y"), (0, shorthands_1.ov)("x"), (0, shorthands_1.ov)("b"))), (0, shorthands_1.la)((0, shorthands_1.ov)("y"), (0, shorthands_1.ov)("x"), (0, shorthands_1.ov)("b")), 1);
test_occs("Pi 0", (0, shorthands_1.pi)((0, shorthands_1.ov)("b"), (0, shorthands_1.ov)("b"), (0, shorthands_1.ov)("b")), (0, shorthands_1.ov)("b"), 0);
test_occs("Pi 1", (0, shorthands_1.pi)((0, shorthands_1.ov)("a"), (0, shorthands_1.ov)("b"), shorthands_1.type_k), (0, shorthands_1.ov)("b"), 1);
test_occs("Pi 2", (0, shorthands_1.pi)((0, shorthands_1.ov)("a"), (0, shorthands_1.pi)((0, shorthands_1.ov)("x"), (0, shorthands_1.ov)("b"), (0, shorthands_1.ov)("x")), (0, shorthands_1.pi)((0, shorthands_1.ov)("y"), (0, shorthands_1.ov)("x"), (0, shorthands_1.ov)("b"))), (0, shorthands_1.ov)("b"), 2);
test_occs("Pi in Pi 1", (0, shorthands_1.pi)((0, shorthands_1.ov)("a"), (0, shorthands_1.pi)((0, shorthands_1.ov)("x"), (0, shorthands_1.ov)("b"), (0, shorthands_1.ov)("x")), (0, shorthands_1.pi)((0, shorthands_1.ov)("y"), (0, shorthands_1.ov)("x"), (0, shorthands_1.ov)("b"))), (0, shorthands_1.pi)((0, shorthands_1.ov)("y"), (0, shorthands_1.ov)("x"), (0, shorthands_1.ov)("b")), 1);