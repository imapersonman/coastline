import { Sig } from "../logical_framework/sig";
import { RequestDefinition } from "./request_definition";
import { Tactic } from "./tactic";
import { UserErrorDefinition } from "./user_error_definition";

export interface VerifiedInteractionSpecification {
    sig: Sig,
    tactics: Record<string, Tactic<any>>,
    requests: Record<string, RequestDefinition<any, any, any, any>>,
    errors: Record<string, UserErrorDefinition<any>>
}