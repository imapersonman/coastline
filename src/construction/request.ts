export class Request<Parameter> { constructor(readonly id: string, readonly parameter: Parameter) {} }
export const request = <Parameter>(id: string, parameter: Parameter): Request<Parameter> => new Request(id, parameter)
export const is_request = (r: any): r is Request<any> => r instanceof Request