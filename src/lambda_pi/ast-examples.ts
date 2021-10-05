import { Application, Constant, Lambda, Pi, TypeKind, Variable } from "./ast";

export const type_kind = new TypeKind()
const c = new Constant("c")
const a = new Constant("a")
const x = new Variable("x")
const y = new Variable("y")
// Application Examples
// cx
export const shallow_application1 = new Application(c, x)
// xc
export const shallow_application2 = new Application(x, c)
// (cx)(xc)
export const deep_application1 = new Application(shallow_application1, shallow_application2)
// (xc)(cx)
export const deep_application2 = new Application(shallow_application2, shallow_application1)
// Lambda Examples
// Lx:Type.c
export const shallow_lambda1 = new Lambda(x, type_kind, c)
// Ly:y.Type
export const shallow_lambda2 = new Lambda(x, y, type_kind)
// Lx:(Lx:Type.c).Ly:y.Type
export const deep_lambda1 = new Lambda(x, shallow_lambda1, shallow_lambda2)
// Ly:(Ly:y.Type).Lx:Type.c
export const deep_lambda2 = new Lambda(x, shallow_lambda2, shallow_lambda1)
// Pi Examples
// Px:Type.c
export const shallow_pi1 = new Pi(x, type_kind, c)
// Py:y.Type
export const shallow_pi2 = new Pi(y, y, type_kind)
// Px:(Px:Type.c).Py:y.Type
export const deep_pi1 = new Pi(x, shallow_pi1, shallow_pi2)
// Py:(Py:y.Type).Px:Type.c
export const deep_pi2 = new Pi(x, shallow_pi2, shallow_pi1)

export default [type_kind, c, a, x, y, shallow_application1, shallow_application2, deep_application1, deep_application2, shallow_lambda1, shallow_lambda2, deep_lambda1, deep_lambda2, shallow_pi1, shallow_pi2, deep_pi1, deep_pi2]
