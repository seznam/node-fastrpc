export type RpcData =
    null |
    boolean |
    number |
    string |
    Date |
    readonly RpcData[] |
    {readonly [property: string]: RpcData}

type RpcScalarDataTypeHint =
    'binary' |
    'boolean' |
    'float' |
    'int' |
    'string' |
    'datetime'

export type RpcDataTypeHint =
    null |
    RpcScalarDataTypeHint |
    {readonly [propertyPath: string]: RpcScalarDataTypeHint}

function serializeCall(procedure: string, args: readonly RpcData[], dataTypeHint: RpcDataTypeHint): number[]
function serialize(data: RpcData, typeHint: RpcDataTypeHint): number[]
function parse(data: readonly number[]): RpcData | {method: string, params: RpcData[]}

export = {
    serializeCall,
    serialize,
    parse,
};
