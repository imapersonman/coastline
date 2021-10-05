import { unionWith } from "lodash"
import { Ast, MetaVariable, Variable } from "../lambda_pi/ast"
import { is_generated_variable, is_indexed_meta_variable } from "../lambda_pi/utilities"
import { IndexedValue } from "./indexed_value"
import { RelativelyNamedAst } from "./relatively_named_ast"

export type AppliedRelativelyNamedAst = { ast: Ast, meta_variables: MetaVariable[], variables: Variable[] }
export const applied_relatively_named_ast = (ast: Ast, meta_variables: MetaVariable[], variables: Variable[]): AppliedRelativelyNamedAst =>
    ({ ast, meta_variables, variables })

/*
- A function that takes in a RelativelyNamedAst and two indexing functions (m and v), applying the RelativelyNamedAst with m and v as input.
- Returns an AppliedRelativelyNamedAst, where ast is the result of this application, mvs are the MetaVariables returned by m, and ovs the Variables returned by v.
*/
export const apply_relatively_named_ast = (rnast: RelativelyNamedAst, m: IndexedValue<MetaVariable>, v: IndexedValue<Variable>): AppliedRelativelyNamedAst => {
    let mvs: MetaVariable[] = [], ovs: Variable[] = []
    const m_wrapped = (i: number) => { const mv = m(i); mvs = unionWith(mvs, [mv], (a, b) => a.id === b.id); return mv }
    const v_wrapped = (i: number) => { const ov = v(i); ovs = unionWith(ovs, [ov], (a, b) => a.id === b.id); return ov }
    const applied = rnast(m_wrapped, v_wrapped)
    // Conditional is there because I'm only sorting Variables/MetaVariables with indices.
    const sorter = (a: MetaVariable, b: MetaVariable): number =>
        (is_indexed_meta_variable(a) || is_generated_variable(a)) && (is_indexed_meta_variable(b) || is_generated_variable(b))
            ? a.index - b.index : 0
    const mvs_sorted = [...mvs.values()].sort(sorter)
    const ovs_sorted = [...ovs.values()].sort(sorter)
    return applied_relatively_named_ast(applied, mvs_sorted, ovs_sorted)
}