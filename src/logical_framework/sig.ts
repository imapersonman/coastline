import { Ast } from "../lambda_pi/ast";
import { ast_to_string } from "../lambda_pi/utilities";
import { RecursiveMap } from "../map/RecursiveMap";
import { display_sig_key, Sig2 } from "./sig2";

// export type Sig = RecursiveMap<Ast>
export type Sig = Sig2

export const display_sig = (sig: Sig) => {
    if (sig.is_empty())
        return '<>'
    const [key, value] = sig.head()
    return [[display_sig_key(key), ast_to_string(value)], ...display_sig(sig.tail())]
}