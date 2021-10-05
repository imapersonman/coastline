import { Ast } from "../lambda_pi/ast";
import { is_unification_error, unify } from "./first_order";

export const unifies_with = (l: Ast, r: Ast) => !is_unification_error(unify([{}, [[l, r]]]))