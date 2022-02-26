import { CoastlineControl } from "./control"
import { err } from "./error"
import { AnyCoastlineObject, CoastlineObject, CoastlineObjectValueMap, cta } from "./object"

export const expect_type = <CT extends keyof CoastlineObjectValueMap>(ct: CT) => (o: AnyCoastlineObject, f: (t: CoastlineObject<CT>) => CoastlineControl): CoastlineControl => {
    if (!cta(ct, o))
        return err('ObjectNotOfType', { object: o, expected: ct })
    return f(o)
}