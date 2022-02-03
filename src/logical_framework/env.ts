import { Ctx } from "./ctx";
import { Sig } from "./sig";

// type Sig = RecursiveMap<Ast>

export class Env {
    constructor(readonly sig: Sig, readonly ctx: Ctx, readonly mctx: Ctx) {}
}