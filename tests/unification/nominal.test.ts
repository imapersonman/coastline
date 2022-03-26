import { Variable } from "../../src/lambda_pi/ast"
import { concat_linked_lists, LinkedList, linked_list, reverse_linked_list } from "../../src/linked_list"

export type Permutation = LinkedList<[Variable, Variable]>

export const permutation: (...swaps: [Variable, Variable][]) => Permutation = linked_list
export const invert: (p: Permutation) => Permutation = reverse_linked_list
export const concat: (p1: Permutation, p2: Permutation) => Permutation = concat_linked_lists