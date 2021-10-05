import { Ast } from "./ast";
import { beta_eta_equality } from "./beta_eta_equality";
import { syntactic_equality } from "./syntactic_equality";
import { is_application, is_lambda, is_pi } from "./utilities";

export function occs(container: Ast, containee: Ast): number {
    if (beta_eta_equality(container, containee))
        return 1
    if (is_application(container))
        return occs(container.head, containee) + occs(container.arg, containee)
    if (is_lambda(container) && !syntactic_equality(container.bound, containee))
        return occs(container.type, containee) + occs(container.scope, containee)
    if (is_pi(container) && !syntactic_equality(container.bound, containee))
        return occs(container.type, containee) + occs(container.scope, containee)
    return 0
}