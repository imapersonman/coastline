import { all_but_last, defined, first, is_empty, last, rest } from "../utilities"
import { Ast } from "./ast"
import { children_of } from "./children_of"
import { is_atom } from "./is_atom"
import { app, la } from "./shorthands"
import { syntactic_equality } from "./syntactic_equality"
import { is_application, is_binder } from "./utilities"

// A Position represents a location where an Ast can be replaced within a given root Ast.
// The empty position [] is where the root Ast is located.
// The length of the position is equal to the depth of the Ast.
// If the number at position[i] exists, is positive, and is equal to n, then the sub Ast being referred to by the position is either
// the Ast at depth i and index n or occurs within the Ast at depth i and index n.
// We'll just assume all the indices are 
export type Position = number[]
export const ast_pos = (...indices: number[]) => {
    if (indices.some((n) => n < 0))
        throw Error("Ast Position cannot contain negative indices!")
    return indices 
}

export const get_ast_at = (root: Ast, position: Position): Ast | undefined => {
    if(is_empty(position))
        return root
    const index = first(position)
    const children = children_of(root)
    if (index < 0 || index >= children.length)
        return undefined
    return get_ast_at(children[index], rest(position))
}

export const replace_ast_at = (root: Ast, position: Position, with_ast: Ast): Ast => {
    if (is_empty(position))
        return with_ast
    const index = first(position)
    const recurse = (to_replace: Ast): Ast => replace_ast_at(to_replace, rest(position), with_ast)
    if (is_atom(root))
        return root
    if (is_application(root))
        if (index === 0)
            return app(recurse(root.head), root.arg)
        else if (index === 1)
            return app(root.head, recurse(root.arg))
        else
            return root
    if (is_binder(root))
        if (index === 0)
            return la(root.bound, recurse(root.type), root.scope)
        else if (index === 1)
            return la(root.bound, root.type, recurse(root.scope))
        else
            return root
    throw new Error(`Input is not an Ast: ${JSON.stringify(root)}`)
}

export const first_position_at_ast = (root: Ast, ast: Ast): Position | undefined => {
    if (syntactic_equality(ast, root))
        return ast_pos()
    if (is_application(root)) {
        const head_pos = first_position_at_ast(root.head, ast)
        if (defined(head_pos))
            return [0, ...head_pos]
        const arg_pos = first_position_at_ast(root.arg, ast)
        if (defined(arg_pos))
            return [1, ...arg_pos]
        return undefined
    }
    if (is_binder(root)) {
        const type_pos = first_position_at_ast(root.type, ast)
        if (defined(type_pos))
            return [0, ...type_pos]
        const scope_pos = first_position_at_ast(root.scope, ast)
        if (defined(scope_pos))
            return [1, ...scope_pos]
        return undefined
    }
    return undefined
}