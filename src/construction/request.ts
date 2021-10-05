export interface Request<Parameter> { id: string, parameter: Parameter }
export const request = <Parameter>(id: string, parameter: Parameter): Request<Parameter> => ({ id, parameter })