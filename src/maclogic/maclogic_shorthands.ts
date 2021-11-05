import { Ast, Variable } from '../lambda_pi/ast'
import { app, con, flapp, iv, la, ov, pi } from '../lambda_pi/shorthands'

export const [i, o] = [con('i'), con('o')]
export const absurd = con('absurd')
export const not = (x: Ast) => flapp(con('not'), x)
export const and = (x: Ast, y: Ast) => flapp(con('and'), x, y)
export const imp = (x: Ast, y: Ast) => flapp(con('imp'), x, y)
export const or = (x: Ast, y: Ast) => flapp(con('or'), x, y)
export const iff = (x: Ast, y: Ast) => flapp(con('iff'), x, y)
export const ml = (x: Ast) =>  app(con('ml'), x)
export const note = (A: Ast, maj: Ast, min: Ast) => flapp(con('note'), A, maj, min)
export const noti = (A: Ast, p: Ast) => flapp(con('noti'), A, p)
export const andel = (l: Ast, r: Ast, andp: Ast) => flapp(con('andel'), l, r, andp)
export const ander = (l: Ast, r: Ast, andp: Ast) => flapp(con('ander'), l, r, andp)
export const andi = (l: Ast, r: Ast, lp: Ast, rp: Ast) => flapp(con('andi'), l, r, lp, rp)
export const impe = (A: Ast, B: Ast, maj: Ast, min: Ast) => flapp(con('impe'), A, B, maj, min)
export const impi = (A: Ast, B: Ast, p: Ast) => flapp(con('impi'), A, B, p)
export const ore = (A: Ast, B: Ast, C: Ast, orp: Ast, pl: Ast, pr: Ast) => flapp(con('ore'), A, B, C, orp, pl, pr)
export const oril = (A: Ast, B: Ast, p: Ast) => flapp(con('oril'), A, B, p)
export const orir = (A: Ast, B: Ast, p: Ast) => flapp(con('orir'), A, B, p)
export const forall = (v: Variable, body: Ast) => flapp(con('forall'), la(v, i, body))
export const foralli = (phi: Ast, p: Ast) => flapp(con('foralli'), phi, p)
export const foralle = (phi: Ast, t: Ast, p: Ast) => flapp(con('foralle'), phi, t, p)
export const [d, e, f, g, h, j, k] = [ov('d'), ov('e'), ov('f'), ov('g'), ov('h'), ov('j'), ov('k')]
export const exists = (v: Variable, body: Ast) => flapp(con('exists'), la(v, i, body))
export const existsi = (phi: Ast, t: Ast, p: Ast) => flapp(con('existsi'), phi, t, p)
export const existse = (phi: Ast, prop: Ast, existsp: Ast, p: Ast) => flapp(con('existse'), phi, prop, existsp, p)
export const dn = (A: Ast, p: Ast) => flapp(con('dn'), A, p)
export const dfl = (A: Ast, B: Ast, p: Ast) => flapp(con('dfl'), A, B, p)
export const dfr = (A: Ast, B: Ast, p: Ast) => flapp(con('dfr'), A, B, p)
export const individuali = (A: Ast, fi: Ast) => flapp(con('individuali'), A, fi)
export const pi_seq = (assumptions: [Variable, Ast][], conclusion: Ast): Ast =>
    assumptions.length === 0 ? conclusion
    : pi(assumptions[0][0], assumptions[0][1], pi_seq(assumptions.slice(1), conclusion))

export const pred = (n: number): Ast =>
    n <= 0 ? o
    : pi(iv(n - 1), i, pred(n - 1))
