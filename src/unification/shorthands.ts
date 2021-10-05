import { Ast } from "../lambda_pi/ast";
import { Substitution, UnificationError, unify as dumb_unify } from "./first_order";

export const unify = (left: Ast, right: Ast): Substitution | UnificationError => dumb_unify([{}, [[left, right]]])