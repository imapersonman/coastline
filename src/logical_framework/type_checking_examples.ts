import { Sort } from "./sort"
import { Application, Ast, Constant, Lambda, Pi, TypeKind, Variable } from "../lambda_pi/ast"
import { RecursiveMap } from "../map/RecursiveMap"
import { Ctx } from "./ctx"
import { Sig } from "./sig"

class TypeCheckingExample {
    constructor(
        readonly name: string,
        readonly sig: Sig, readonly ctx: Ctx, readonly ast: Ast, readonly sort: Sort) {}
}

let examples: TypeCheckingExample[] = []
function add_example(example: TypeCheckingExample) {
    examples.push(example)
    return example
}

function n_ary_app(head: Ast, ...args: Ast[]): Ast {
    if (args.length === 0)
        return head
    return new Application(n_ary_app(head, ...args.slice(0, -1)), args[args.length - 1])
}

// Signature:
// o: Type
const o = add_example(new TypeCheckingExample(
    "o",
    RecursiveMap.empty(),
    RecursiveMap.empty(),
    new Constant("o"),
    new TypeKind))
// absurd: o
const absurd = add_example(new TypeCheckingExample(
    "absurd",
    o.sig.add("o", o.sort),
    RecursiveMap.empty(),
    new Constant("absurd"),
    o.ast))
// Variables (assuming they're in the given context)
const [p, q] = [new Variable("p"), new Variable("q")]
// ml: Pp:o.Type
const ml = add_example(new TypeCheckingExample(
    "ml",
    absurd.sig.add("absurd", absurd.sort),
    RecursiveMap.empty(),
    new Constant("ml"),
    new Pi(p, o.ast, new TypeKind)))
const ml_f = (a: Ast) => new Application(ml.ast, a)
// not: Pp:o.o
const not = add_example(new TypeCheckingExample(
    "not",
    ml.sig.add("ml", ml.sort),
    RecursiveMap.empty(),
    new Constant("not"),
    new Pi(p, o.ast, o.ast)))
const not_f = (a: Ast) => new Application(not.ast, a)
// Binary
const sort_bin = new Pi(p, o.ast, new Pi(q, o.ast, o.ast))
const bin_app = (head: Ast) => (a: Ast, b: Ast) => n_ary_app(head, a, b)
// imp: Pp:o.Pq:o.o
const imp = add_example(new TypeCheckingExample(
    "imp",
    not.sig.add("not", not.sort),
    RecursiveMap.empty(),
    new Constant("imp"),
    sort_bin))
const imp_f = bin_app(imp.ast)
// and: Pp:o.Pq:o.o
const and = add_example(new TypeCheckingExample(
    "and",
    imp.sig.add("imp", imp.sort),
    RecursiveMap.empty(),
    new Constant("and"),
    sort_bin))
const and_f = bin_app(and.ast)
// or: Pp:o.Pq:o.o
const or = add_example(new TypeCheckingExample(
    "or",
    and.sig.add("and", and.sort),
    RecursiveMap.empty(),
    new Constant("or"),
    sort_bin))
const or_f = bin_app(or.ast)
// iff: Pp:o.Pq:o.o
const iff = add_example(new TypeCheckingExample(
    "iff",
    or.sig.add("or", or.sort),
    RecursiveMap.empty(),
    new Constant("iff"),
    sort_bin))
const iff_f = bin_app(iff.ast)
// noti: Pp:o.Pf:(Pa:ml(p).ml(absurd)).ml(not(p))
const [f, a, b, c] = [new Variable("f"), new Variable("a"), new Variable("b"), new Variable("c")]
const noti = add_example(new TypeCheckingExample(
    "noti",
    iff.sig.add("iff", iff.sort),
    RecursiveMap.empty(),
    new Constant("noti"),
    new Pi(p, o.ast, new Pi(f, new Pi(a, ml_f(p), ml_f(absurd.ast)), ml_f(not_f(p))))))
const noti_f = (p: Ast, f: Ast) => n_ary_app(noti.ast, p, f)
// note: Pp:o.Pmaj:ml(not(p)).Pmin:ml(p).ml(absurd)
const [maj, min] = [new Variable("maj"), new Variable("min")]
const note = add_example(new TypeCheckingExample(
    "note",
    noti.sig.add("noti", noti.sort),
    RecursiveMap.empty(),
    new Constant("note"),
    new Pi(p, o.ast, new Pi(maj, ml_f(not_f(p)), new Pi(min, ml_f(p), ml_f(absurd.ast))))))
const note_f = (p: Ast, maj: Ast, min: Ast) => n_ary_app(note.ast, p, maj, min)
// andi: Pp:o.Pq:o.Pl:ml(p).Pr:ml(q).ml(and(p)(q))
const [l, r] = [new Variable("l"), new Variable("r")]
const andi = add_example(new TypeCheckingExample(
    "andi",
    note.sig.add("note", note.sort),
    RecursiveMap.empty(),
    new Constant("andi"),
    new Pi(p, o.ast, new Pi(q, o.ast, new Pi(l, ml_f(p), new Pi(r, ml_f(q), ml_f(and_f(p, q))))))))
const andi_f = (a: Ast, b: Ast, l: Ast, r: Ast) => n_ary_app(andi.ast, a, b, l, r)
// andel: Pp:o.Pq:o.Pr:ml(and(A)(B)).ml(A)
const andel = add_example(new TypeCheckingExample(
    "andel",
    andi.sig.add("andi", andi.sort),
    RecursiveMap.empty(),
    new Constant("andel"),
    new Pi(p, o.ast, new Pi(q, o.ast, new Pi(r, ml_f(and_f(p, q)), ml_f(p))))))
const andel_f = (A: Ast, B: Ast, p: Ast) => n_ary_app(andel.ast, A, B, p)
const [Av, Bv] = [new Variable("A"), new Variable("B")]
// andel: Pp:o.Pq:o.Pr:ml(and(A)(B)).ml(A)
const ander = add_example(new TypeCheckingExample(
    "ander",
    andel.sig.add("andel", andel.sort),
    RecursiveMap.empty(),
    new Constant("ander"),
    new Pi(p, o.ast, new Pi(q, o.ast, new Pi(r, ml_f(and_f(p, q)), ml_f(q))))))
const ander_f = (A: Ast, B: Ast, p: Ast) => n_ary_app(ander.ast, A, B, p)
// impi: Pp:o.Pq:o.Pf:(Pa:ml(p).ml(q)).ml(imp(p)(q))
const impi = add_example(new TypeCheckingExample(
    "impi",
    ander.sig.add("ander", ander.sort),
    RecursiveMap.empty(),
    new Constant("impi"),
    new Pi(p, o.ast, new Pi(q, o.ast, new Pi(f, new Pi(a, ml_f(p), ml_f(q)), ml_f(imp_f(p, q)))))))
const impi_f = (A: Ast, B: Ast, p: Ast) => n_ary_app(impi.ast, A, B, p)
// impe: Pp:o.Pq:o.Pmaj:ml(imp(p)(q)).Pmin:ml(p).ml(q)
const impe = add_example(new TypeCheckingExample(
    "impe",
    impi.sig.add("impi", impi.sort),
    RecursiveMap.empty(),
    new Constant("impe"),
    new Pi(p, o.ast, new Pi(q, o.ast, new Pi(maj, ml_f(imp_f(p, q)), new Pi(min, ml_f(p), ml_f(q)))))))
const impe_f = (A: Ast, B: Ast, maj: Ast, min: Ast) => n_ary_app(impe.ast, A, B, maj, min)

// Proofs
const sig = impe.sig.add("impe", impe.sort)
// LA:o.LB:o.La:ml(and(A)(B)).andi(B)(A)(ander(A)(B)(a))(andel(A)(B)(a))
// : PA:o.PB:o.Pa:ml(and(A)(B)).ml(and(B)(A))
const [A, B] = [new Variable("A"), new Variable("B")]
const and_comm_proof = add_example(new TypeCheckingExample(
    "and commutative proof",
    sig,
    RecursiveMap.empty(),
    new Lambda(Av, o.ast, new Lambda(Bv, o.ast, new Lambda(p, ml_f(and_f(A, B)), andi_f(B, A, ander_f(A, B, p), andel_f(A, B, p))))),
    new Pi(Av, o.ast, new Pi(Bv, o.ast, new Pi(p, ml_f(and_f(A, B)), ml_f(and_f(B, A)))))))
// LR:o.LS:o.LT:o.La:ml(imp(R)(imp(S)(T))).Lb:ml(S).impi(R)(T)(Lc:ml(R).impe(S)(T)(impe(R)(imp(S)(T))(a)(c))(b))
// : PR:o.PS:o.PT:o.Pa:ml(imp(R)(imp(S)(T))).Pb:ml(S).ml(imp(R)(T))
const L = (b: Variable, t: Ast, s: Ast) => new Lambda(b, t, s)
const P = (b: Variable, t: Ast, s: Ast) => new Pi(b, t, s)
const [R, S, T] = [new Variable("R"), new Variable("S"), new Variable("T")]
const R_S_T_S_proves_R_T = add_example(new TypeCheckingExample(
    "R -> (S -> T), S |- R -> T proof",
    sig,
    RecursiveMap.empty(),
    L(R, o.ast, L(S, o.ast, L(T, o.ast, L(a, ml_f(imp_f(R, imp_f(S, T))), L(b, ml_f(S), impi_f(R, T, L(c, ml_f(R), impe_f(S, T, impe_f(R, imp_f(S, T), a, c), b)))))))),
    P(R, o.ast, P(S, o.ast, P(T, o.ast, P(a, ml_f(imp_f(R, imp_f(S, T))), P(b, ml_f(S), ml_f(imp_f(R, T)))))))))
// LA:o.LB:o.La:ml(imp(A)(B)).Lb:ml(not(B)).noti(A)(Lc:ml(A).note(B)(b)(impe(A)(B)(a)(c)))
// PA:o.PB:o.Pa:ml(imp(A)(B)).Pb:ml(not(B)).ml(not(A))
const A_B_not_B_not_A = add_example(new TypeCheckingExample(
    "A -> B, ~B |- ~A proof",
    sig,
    RecursiveMap.empty(),
    L(A, o.ast, L(B, o.ast, L(a, ml_f(imp_f(A, B)), L(b, ml_f(not_f(B)), noti_f(A, L(c, ml_f(A), note_f(B, b, impe_f(A, B, a, c)))))))),
    L(A, o.ast, L(B, o.ast, L(a, ml_f(imp_f(A, B)), L(b, ml_f(not_f(B)), ml_f(not_f(A))))))))

export default examples

