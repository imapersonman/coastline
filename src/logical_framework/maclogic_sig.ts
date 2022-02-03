import { TypeKind } from "../lambda_pi/ast";
import { try_parse } from "../lambda_pi/parsers/parser";
import { con } from "../lambda_pi/shorthands";
import { mk_sig } from "./sig2";

const type_k = new TypeKind
const o = con("o")

export default mk_sig(
    [con("o"), type_k],
    [con("i"), type_k],
    [con("absurd"), o],
    [con("ml"), try_parse("P(p: o).Type")],
    [con("not"), try_parse("P(q: o).o")],
    [con("and"), try_parse("P(x: o).P(y: o).o")],
    [con("or"), try_parse("P(x: o).P(y: o).o")],
    [con("imp"), try_parse("P(x: o).P(y: o).o")],
    [con("iff"), try_parse("P(x: o).P(y: o).o")],
    [con("forall"), try_parse("P(b: P(x: i).o).o")],
    [con("exists"), try_parse("P(b: P(x: i).o).o")],
    [con("andel"), try_parse("P(A: o).P(B: o).P(p: ml (and A B)).ml A")],
    [con("ander"), try_parse("P(A: o).P(B: o).P(p: ml (and A B)).ml B")],
    [con("andi"), try_parse("P(A: o).P(B: o).P(l: ml A).P(r: ml B).ml (and A B)")],
    [con("impe"), try_parse("P(A: o).P(B: o).P(maj: ml (imp A B)).P(min: ml A).ml B")],
    [con("impi"), try_parse("P(A: o).P(B: o).P(p: P(x: ml A).ml B).ml (imp A B)")],
    [con("note"), try_parse("P(A: o).P(maj: ml (not A)).P(min: ml A).ml absurd")],
    [con("noti"), try_parse("P(A: o).P(p: P(x: ml A).ml absurd).ml (not A)")],
    [con("ore"), try_parse("P(A: o).P(B: o).P(C: o).P(orp: ml (or A B)).P(pl: P(a: ml A).ml C).P(pr: P(b: ml B).ml C).ml C")],
    [con("oril"), try_parse("P(A: o).P(B: o).P(lp: ml A).ml (or A B)")],
    [con("orir"), try_parse("P(A: o).P(B: o).P(lp: ml B).ml (or A B)")],
    [con("foralle"), try_parse("P(phi: P(x: i).o).P(t: i).P(p: ml (forall phi)).ml (phi t)")],
    [con("foralli"), try_parse("P(phi: P(x: i).o).P(p: P(t: i).ml (phi t)).ml (forall phi)")],
    [con("existse"), try_parse("P(phi: P(a: i).o).P(A: o).P(e: ml (exists phi)).P(p: P(x: i).P(y: ml (phi x)).ml A).ml A")],
    [con("existsi"), try_parse("P(phi: P(x: i).o).P(t: i).P(p: ml (phi t)).ml (exists phi)")],
    [con("dn"), try_parse("P(A: o).P(p: ml (not (not A))).ml A")],
    [con("dfl"), try_parse("P(A: o).P(B: o).P(iff: ml (iff A B)).ml (and (imp A B) (imp B A))")],
    [con("dfr"), try_parse("P(A: o).P(B: o).P(andp: ml (and (imp A B) (imp B A))).ml (iff A B)")],
    [con("individuali"), try_parse("P(A: o).P(if: P(a: i).ml A).ml A")],
)