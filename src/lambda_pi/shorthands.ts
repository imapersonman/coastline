import { first, rest } from "../utilities"
import { Application, Ast, Constant, GeneratedVariable, IndexedMetaVariable, Lambda, MetaVariable, NaturalNumber, Pi, TypeKind, Variable } from "./ast"

export const type_k = new TypeKind
export const app = (h: Ast, a: Ast) => new Application(h, a)
export const ov = (id: string) => new Variable(id)
export const con = (id: string) => new Constant(id)
export const nat = (value: number) => new NaturalNumber(value)
export const [mv, la, pi] = [(id: string) => new MetaVariable(id), (b: Variable, t: Ast, s: Ast) => new Lambda(b, t, s), (b: Variable, t: Ast, s: Ast) => new Pi(b, t, s)]
export const gv = (base: string, index: number) => new GeneratedVariable(base, index)
export const flapp = (head: Ast, arg0: Ast, ...rest_args: Ast[]): Application => {
    if (rest_args.length === 0) return app(head, arg0)
    return app(flapp(head, arg0, ...rest_args.slice(0, -1)), rest_args[rest_args.length - 1])
}
export const ovlist = (...names: string[]) => names.map((name) => ov(name))
export const mvlist = (...names: string[]) => names.map((name) => mv(name))
export const clist = (...names: string[]) => names.map((name) => con(name))
export const iv = (index: number) => new GeneratedVariable("", index)
export const imv = (index: number) => new IndexedMetaVariable(index)
export const iovlist = (...indices: number[]) => indices.map((index) => new GeneratedVariable("", index))
export const imvlist = (...indices: number[]) => indices.map((index) => new IndexedMetaVariable(index))
export const nary = <Operands extends Ast[]>(name: string) => (first_operand: Ast, ...operands: Operands): Ast =>
    flapp(con(name), first_operand, ...operands)
export const func_type = (its: Ast[], rt: Ast): Ast =>
    its.length === 0 ? rt
    : pi(iv(its.length - 1), first(its), func_type(rest(its), rt))