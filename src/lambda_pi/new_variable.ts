import { GeneratedVariable, Variable } from "./ast"
import { ast_in } from "./utilities"

export function new_variable(free: Variable[], old: Variable): Variable {
    if (!ast_in(old, free))
        return old
    const base_equals_old_base = (e: Variable) => get_base(e) === get_base(old)
    const variables_with_old_base = free.filter(base_equals_old_base)
    const max_free_idx = Math.max(...variables_with_old_base.map(get_index))
    return new GeneratedVariable(get_base(old), max_free_idx + 1)
}

const get_index = (v: Variable) => v.get_index()
const get_base = (v: Variable) => v.get_base_id()