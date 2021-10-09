import { TypeKind } from "../lambda_pi/ast";
import { try_parse } from "../lambda_pi/parsers/parser";
import { con } from "../lambda_pi/shorthands";
import { mk_map } from "../map/RecursiveMap";

const type_k = new TypeKind
const o = con("o")

export default mk_map(
    ["o", type_k],
    ["i", type_k],
    ["absurd", o],
    ["ml", try_parse("P(p: o).Type")],
    ["not", try_parse("P(q: o).o")],
    ["and", try_parse("P(x: o).P(y: o).o")],
    ["or", try_parse("P(x: o).P(y: o).o")],
    ["imp", try_parse("P(x: o).P(y: o).o")],
    ["iff", try_parse("P(x: o).P(y: o).o")],
    ["forall", try_parse("P(b: P(x: i).o).o")],
    ["exists", try_parse("P(b: P(x: i).o).o")],
    ["andel", try_parse("P(A: o).P(B: o).P(p: ml (and A B)).ml A")],
    ["ander", try_parse("P(A: o).P(B: o).P(p: ml (and A B)).ml B")],
    ["andi", try_parse("P(A: o).P(B: o).P(l: ml A).P(r: ml B).ml (and A B)")],
    ["impe", try_parse("P(A: o).P(B: o).P(maj: ml (imp A B)).P(min: ml A).ml B")],
    ["impi", try_parse("P(A: o).P(B: o).P(p: P(x: ml A).ml B).ml (imp A B)")],
    ["note", try_parse("P(A: o).P(maj: ml (not A)).P(min: ml A).ml absurd")],
    ["noti", try_parse("P(A: o).P(p: P(x: ml A).ml absurd).ml (not A)")],
    ["ore", try_parse("P(A: o).P(B: o).P(C: o).P(orp: ml (or A B)).P(pl: P(a: ml A).ml C).P(pr: P(b: ml B).ml C).ml C")],
    ["oril", try_parse("P(A: o).P(B: o).P(lp: ml A).ml (or A B)")],
    ["orir", try_parse("P(A: o).P(B: o).P(lp: ml B).ml (or A B)")],
    ["foralle", try_parse("P(phi: P(x: i).o).P(t: i).P(p: ml (forall phi)).ml (phi t)")],
    ["foralli", try_parse("P(phi: P(x: i).o).P(p: P(t: i).ml (phi t)).ml (forall phi)")],
    ["existse", try_parse("P(phi: P(a: i).o).P(A: o).P(e: ml (exists phi)).P(p: P(x: i).P(y: ml (phi x)).ml A).ml A")],
    ["existsi", try_parse("P(phi: P(x: i).o).P(t: i).P(p: ml (phi t)).ml (exists phi)")],
    ["dn", try_parse("P(A: o).P(p: ml (not (not A))).ml A")],
    ["dfl", try_parse("P(A: o).P(B: o).P(iff: ml (iff A B)).ml (and (imp A B) (imp B A))")],
    ["dfr", try_parse("P(A: o).P(B: o).P(andp: ml (and (imp A B) (imp B A))).ml (iff A B)")],
    ["individuali", try_parse("P(A: o).P(if: P(a: i).ml A).ml A")],
    // sequents
    /*
    ["ds", try_parse("P(A: o).P(B: o).P(u1: ml (or A B)).P(u2: ml (not A)).ml B")],
    ["mt", try_parse("P(A: o).P(B: o).P(u1: ml (imp A B)).P(u2: ml (not B)).ml (not A)")],
    ["pm1", try_parse("P(A: o).P(B: o).P(u1: ml A).ml (imp B A)")],
    ["pm2", try_parse("P(A: o).P(B: o).P(u1: ml (not A)).ml (imp A B)")],
    ["dn_plus", try_parse("P(A: o).P(u1: ml A).ml (not (not A))")],
    ["dem1", try_parse("P(A: o).P(B: o).P(u1: ml (not (and A B))).ml (or (not A) (not B))")],
    ["dem2", try_parse("P(A: o).P(B: o).P(u1: ml (or (not A) (not B))).ml (not (and A B))")],
    ["dem3", try_parse("P(A: o).P(B: o).P(u1: ml (not (or A B))).ml (and (not A) (not B))")],
    ["dem4", try_parse("P(A: o).P(B: o).P(u1: ml (and (not A) (not B))).ml (not (or A B))")],
    ["dem5", try_parse("P(A: o).P(B: o).P(u1: ml (not (or (not A) (not B)))).ml (and A B)")],
    ["dem6", try_parse("P(A: o).P(B: o).P(u1: ml (and A B)).ml (not (or (not A) (not B)))")],
    ["dem7", try_parse("P(A: o).P(B: o).P(u1: ml (not (and (not A) (not B)))).ml (or A B)")],
    ["dem8", try_parse("P(A: o).P(B: o).P(u1: ml (or A B)).ml (not (and (not A) (not B)))")],
    ["imp1", try_parse("P(A: o).P(B: o).P(u1: ml (imp A B)).ml (or (not A) B)")],
    ["imp2", try_parse("P(A: o).P(B: o).P(u1: ml (or (not A) B)).ml (imp A B)")],
    ["neg_imp1", try_parse("P(A: o).P(B: o).P(u1: ml (not (imp A B))).ml (and A (not B))")],
    ["neg_imp2", try_parse("P(A: o).P(B: o).P(u1: ml (and A (not B))).ml (not (imp A B))")],
    ["com_and", try_parse("P(A: o).P(B: o).P(u1: ml (and A B)).ml (and B A)")],
    ["com_or", try_parse("P(A: o).P(B: o).P(u1: ml (or A B)).ml (or B A)")],
    ["com_bic", try_parse("P(A: o).P(B: o).P(u1: ml (iff A B)).ml (iff B A)")],
    ["dist1", try_parse("P(A: o).P(B: o).P(C: o).P(u1: ml (and A (or B C))).ml (or (and A B) (and A C))")],
    ["dist2", try_parse("P(A: o).P(B: o).P(C: o).P(u1: ml (or (and A B) (and A C))).ml (and A (or B C))")],
    ["dist3", try_parse("P(A: o).P(B: o).P(C: o).P(u1: ml (or A (and B C))).ml (and (or A B) (or A C))")],
    ["dist4", try_parse("P(A: o).P(B: o).P(C: o).P(u1: ml (and (or A B) (or A C))).ml (or A (and B C))")],
    ["lem", try_parse("P(A: o).ml (or A (not A))")],
    ["sdn-and1", try_parse("P(A: o).P(B: o).P(u1: ml (and (not (not A)) B)).ml (and A B)")],
    // ["sdn-and2", try_parse("")]
    */
    )