export type RpcData =
    null |
    boolean |
    number |
    string |
    Date |
    readonly RpcData[] |
    {readonly [property: string]: RpcData}

export type RpcDataTypeHint =
    null |
    'binary' |
    'boolean' |
    'float' |
    'int' |
    'string' |
    'datetime' |
    {readonly [propertyPath: string]: RpcDataTypeHint}

function serializeCall(procedure: string, args: readonly RpcData[], dataTypeHint: RpcDataTypeHint): number[]
function serialize(data: RpcData, typeHint: RpcDataTypeHint): number[]
function parse(data: readonly number[]): RpcData | {method: string, params: RpcData[]}

export = {
    serializeCall,
    serialize,
    parse,
};
