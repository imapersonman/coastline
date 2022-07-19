import { CoastlineControl } from "./control"
import { err, ErrorValueMap, object_not_of_any_type_error, object_not_of_type_error } from "./error"
import { AnyCoastlineObject, CoastlineObject, cta, ObjectValueMap } from "./object"

export const expect_type = <
    OVM extends ObjectValueMap,
    EVM extends ErrorValueMap,
    CT extends keyof OVM>(ct: CT) => (o: AnyCoastlineObject<OVM>,
    f: (t: CoastlineObject<OVM, CT>) => CoastlineControl<OVM, EVM>
): CoastlineControl<OVM, EVM> => {
    if (!cta(ct, o))
        return object_not_of_type_error(o, ct)
    return f(o)
}

export const expect_types = <
    OVM extends ObjectValueMap,
    EVM extends ErrorValueMap,
    CT extends keyof OVM>(...cts: CT[]) => (o: AnyCoastlineObject<OVM>, f: (o: CoastlineObject<OVM, CT>) => CoastlineControl<OVM, EVM>
): CoastlineControl<OVM, EVM> => {
    for (const ct of cts)
        if (cta(ct, o))
            return f(o)
    return object_not_of_any_type_error(o, cts, o.type)
}