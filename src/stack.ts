import { defined, first, is_empty, rest } from "./utilities"

export class EmptyStack {}
export const is_empty_stack = <Entry>(e: Stack<Entry>): e is EmptyStack => e instanceof EmptyStack

export class NonEmptyStack<Entry> { constructor(readonly entry: Entry, readonly rest: Stack<Entry>) {} }
export const is_non_empty_stack = <Entry>(n: Stack<Entry>): n is NonEmptyStack<Entry> => n instanceof NonEmptyStack

export type Stack<Entry> = EmptyStack | NonEmptyStack<Entry>

// Entries given at the beginning are at the top of the stack.
export const mk_stack = <Entry>(...entries: Entry[]): Stack<Entry> => {
    if (is_empty(entries))
        return new EmptyStack
    return new NonEmptyStack(first(entries), mk_stack(...rest(entries)))
}

export const push_entry = <Entry>(stack: Stack<Entry>, entry: Entry): Stack<Entry> => new NonEmptyStack(entry, stack)
export const push_entries = <Entry>(stack: Stack<Entry>, entries: Entry[]): Stack<Entry> =>
    is_empty(entries) ? stack
    : push_entry(push_entries(stack, rest(entries)), first(entries))

export const pop_entry = <Entry>(stack: NonEmptyStack<Entry>): [Entry, Stack<Entry>] => [stack.entry, stack.rest]
export const possibly_pop_n_entries = <Entry>(stack: Stack<Entry>, n: number): [Entry[], Stack<Entry>] | undefined => {
    if (n <= 0)
        return [[], stack]
    if (!is_non_empty_stack(stack))
        return undefined
    const popped_n_minus_1 = possibly_pop_n_entries(stack.rest, n - 1)
    if (!defined(popped_n_minus_1))
        return undefined
    const [entries, popped_stack] = popped_n_minus_1
    return [[stack.entry, ...entries], popped_stack]
}

export const stack_length = (stack: Stack<unknown>): number => is_non_empty_stack(stack) ? 1 + stack_length(stack.rest) : 0
export const display_stack = <Entry>(stack: Stack<Entry>, display_entry: (e: Entry) => any = JSON.stringify) => {
    if (is_non_empty_stack(stack))
        return [display_entry(stack.entry), ...display_stack(stack.rest, display_entry)]
    return []
}