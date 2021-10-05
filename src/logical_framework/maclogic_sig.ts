import { TypeKind } from "../lambda_pi/ast";
import { safe_parse } from "../lambda_pi/parsers/lambda_pi_parser";
import { con } from "../lambda_pi/shorthands";
import { mk_map } from "../map/RecursiveMap";

const type_k = new TypeKind
const o = con("o")

export default mk_map(
    ["o", type_k],
    ["i", type_k],
    ["absurd", o],
    ["ml", safe_parse("P(p: o).Type")],
    ["not", safe_parse("P(q: o).o")],
    ["and", safe_parse("P(x: o).P(y: o).o")],
    ["or", safe_parse("P(x: o).P(y: o).o")],
    ["imp", safe_parse("P(x: o).P(y: o).o")],
    ["iff", safe_parse("P(x: o).P(y: o).o")],
    ["forall", safe_parse("P(b: P(x: i).o).o")],
    ["exists", safe_parse("P(b: P(x: i).o).o")],
    ["andel", safe_parse("P(A: o).P(B: o).P(p: ml (and A B)).ml A")],
    ["ander", safe_parse("P(A: o).P(B: o).P(p: ml (and A B)).ml B")],
    ["andi", safe_parse("P(A: o).P(B: o).P(l: ml A).P(r: ml B).ml (and A B)")],
    ["impe", safe_parse("P(A: o).P(B: o).P(maj: ml (imp A B)).P(min: ml A).ml B")],
    ["impi", safe_parse("P(A: o).P(B: o).P(p: P(x: ml A).ml B).ml (imp A B)")],
    ["note", safe_parse("P(A: o).P(maj: ml (not A)).P(min: ml A).ml absurd")],
    ["noti", safe_parse("P(A: o).P(p: P(x: ml A).ml absurd).ml (not A)")],
    ["ore", safe_parse("P(A: o).P(B: o).P(C: o).P(orp: ml (or A B)).P(pl: P(a: ml A).ml C).P(pr: P(b: ml B).ml C).ml C")],
    ["oril", safe_parse("P(A: o).P(B: o).P(lp: ml A).ml (or A B)")],
    ["orir", safe_parse("P(A: o).P(B: o).P(lp: ml B).ml (or A B)")],
    ["foralle", safe_parse("P(phi: P(x: i).o).P(t: i).P(p: ml (forall phi)).ml (phi t)")],
    ["foralli", safe_parse("P(phi: P(x: i).o).P(p: P(t: i).ml (phi t)).ml (forall phi)")],
    ["existse", safe_parse("P(phi: P(a: i).o).P(A: o).P(e: ml (exists phi)).P(p: P(x: i).P(y: ml (phi x)).ml A).ml A")],
    ["existsi", safe_parse("P(phi: P(x: i).o).P(t: i).P(p: ml (phi t)).ml (exists phi)")],
    ["dn", safe_parse("P(A: o).P(p: ml (not (not A))).ml A")],
    ["dfl", safe_parse("P(A: o).P(B: o).P(iff: ml (iff A B)).ml (and (imp A B) (imp B A))")],
    ["dfr", safe_parse("P(A: o).P(B: o).P(andp: ml (and (imp A B) (imp B A))).ml (iff A B)")],
    ["individuali", safe_parse("P(A: o).P(if: P(a: i).ml(A)).ml(A)")],
    // sequents
    /*
    ["ds", safe_parse("P(A: o).P(B: o).P(u1: ml (or A B)).P(u2: ml (not A)).ml B")],
    ["mt", safe_parse("P(A: o).P(B: o).P(u1: ml (imp A B)).P(u2: ml (not B)).ml (not A)")],
    ["pm1", safe_parse("P(A: o).P(B: o).P(u1: ml A).ml (imp B A)")],
    ["pm2", safe_parse("P(A: o).P(B: o).P(u1: ml (not A)).ml (imp A B)")],
    ["dn_plus", safe_parse("P(A: o).P(u1: ml A).ml (not (not A))")],
    ["dem1", safe_parse("P(A: o).P(B: o).P(u1: ml (not (and A B))).ml (or (not A) (not B))")],
    ["dem2", safe_parse("P(A: o).P(B: o).P(u1: ml (or (not A) (not B))).ml (not (and A B))")],
    ["dem3", safe_parse("P(A: o).P(B: o).P(u1: ml (not (or A B))).ml (and (not A) (not B))")],
    ["dem4", safe_parse("P(A: o).P(B: o).P(u1: ml (and (not A) (not B))).ml (not (or A B))")],
    ["dem5", safe_parse("P(A: o).P(B: o).P(u1: ml (not (or (not A) (not B)))).ml (and A B)")],
    ["dem6", safe_parse("P(A: o).P(B: o).P(u1: ml (and A B)).ml (not (or (not A) (not B)))")],
    ["dem7", safe_parse("P(A: o).P(B: o).P(u1: ml (not (and (not A) (not B)))).ml (or A B)")],
    ["dem8", safe_parse("P(A: o).P(B: o).P(u1: ml (or A B)).ml (not (and (not A) (not B)))")],
    ["imp1", safe_parse("P(A: o).P(B: o).P(u1: ml (imp A B)).ml (or (not A) B)")],
    ["imp2", safe_parse("P(A: o).P(B: o).P(u1: ml (or (not A) B)).ml (imp A B)")],
    ["neg_imp1", safe_parse("P(A: o).P(B: o).P(u1: ml (not (imp A B))).ml (and A (not B))")],
    ["neg_imp2", safe_parse("P(A: o).P(B: o).P(u1: ml (and A (not B))).ml (not (imp A B))")],
    ["com_and", safe_parse("P(A: o).P(B: o).P(u1: ml (and A B)).ml (and B A)")],
    ["com_or", safe_parse("P(A: o).P(B: o).P(u1: ml (or A B)).ml (or B A)")],
    ["com_bic", safe_parse("P(A: o).P(B: o).P(u1: ml (iff A B)).ml (iff B A)")],
    ["dist1", safe_parse("P(A: o).P(B: o).P(C: o).P(u1: ml (and A (or B C))).ml (or (and A B) (and A C))")],
    ["dist2", safe_parse("P(A: o).P(B: o).P(C: o).P(u1: ml (or (and A B) (and A C))).ml (and A (or B C))")],
    ["dist3", safe_parse("P(A: o).P(B: o).P(C: o).P(u1: ml (or A (and B C))).ml (and (or A B) (or A C))")],
    ["dist4", safe_parse("P(A: o).P(B: o).P(C: o).P(u1: ml (and (or A B) (or A C))).ml (or A (and B C))")],
    ["lem", safe_parse("P(A: o).ml (or A (not A))")],
    ["sdn-and1", safe_parse("P(A: o).P(B: o).P(u1: ml (and (not (not A)) B)).ml (and A B)")],
    // ["sdn-and2", safe_parse("")]
    */
    )