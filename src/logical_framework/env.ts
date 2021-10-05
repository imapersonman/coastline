import { Ast } from "../lambda_pi/ast";
import { RecursiveMap } from "../map/RecursiveMap";

type Sig = RecursiveMap<Ast>
type Ctx = RecursiveMap<Ast>

export class Env {
    constructor(readonly sig: Sig, readonly ctx: Ctx, readonly mctx: Ctx) {}
}