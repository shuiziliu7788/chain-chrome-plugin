import {AbiCoder, concat, FunctionFragment, getUint} from "ethers";
import {signatureWithDataRegExp} from "./regexp";
import dayjs from "dayjs";

export const abiCoder = AbiCoder.defaultAbiCoder()

export interface ParamType {
    type: string
    baseType: string
    name?: string
    hash?: string
    value?: string
    fixed?: boolean
    error?: boolean
}

export interface Func {
    signature_hash: string,
    signature_text?: string,
    name?: string,
    input?: string,
    isHash?: boolean,
    inputs?: ParamType[],
    outputs?: ParamType[],
}

export const Function = (name): Func => {
    name = name.split("{")[0];
    name = name.split(";")[0];
    name = name.replace(/(\n)|(\s+)/g, " ").trim()
    name = name.replace(/(^function)|(override)/g, "").trim()
    const fragment = FunctionFragment.from(name);

    return {
        signature_hash: fragment.selector,
        signature_text: fragment.format(),
        name: fragment.name,
        inputs: fragment.inputs.map(({type, name, baseType}) => {
            return {type, name, baseType, fixed: true}
        }),
        outputs: fragment.outputs.map(({type, name, baseType}) => {
            return {type, name, baseType, fixed: true}
        })
    }
}

export const generate = (name: string): Func => {
    let fragment: Func = {
        signature_hash: "",
        inputs: [],
        outputs: [],
        input: "",
        isHash: false,
    }
    if (typeof name !== "string" || name == "") {
        throw new Error("签名方法不能为空")
    }
    name = name.trim()
    if (/^unknown[0-9a-fA-f]{8}(Address)*$/.test(name)) {
        name = name.replace("unknown", "0x").replace("Address", "")
    } else if (/^[a-zA-Z$_][a-zA-Z0-9$_]*$/.test(name)) {
        name = name + "()"
    }
    // 仅签名
    if (/^0x[0-9A-Fa-f]{8}$/.test(name)) {
        fragment.signature_hash = name
        fragment.isHash = true
        return fragment
    }
    // input
    if (/^0x[0-9A-Fa-f]{8}[0-9A-Fa-f]{64,}$/.test(name)) {
        fragment.signature_hash = name.substring(0, 10)
        fragment.input = name
        return fragment
    }
    const func = Function(name);

    if (/^unknown[0-9a-fA-f]{8}\(/.test(name)) {
        func.signature_hash = "0x" + name.substring(7, 15)
    }
    if (func.outputs && func.outputs.length == 1 && !func.outputs[0].name) {
        func.outputs[0].name = func.name
    }
    return {
        signature_text: func.signature_text,
        signature_hash: func.signature_hash,
        inputs: func.inputs,
        isHash: false,
        outputs: func.outputs,
    }
}

export const encode = (f: Func): string => {
    let data = f.signature_hash
    if (f.input && signatureWithDataRegExp.test(f.input)) {
        return f.input
    }
    if (f.inputs && f.inputs.length > 0) {
        let types = []
        let values = []
        for (let i = 0; i < f.inputs.length; i++) {
            const type = f.inputs[i].type
            let value = f.inputs[i].value
            if (value == undefined) {
                throw new Error(`参数${f.inputs[i].name ?? i}不能为空`)
            }
            if (f.inputs[i].baseType == 'array') {
                values.push(JSON.parse(value ?? "[]"))
            } else if (f.inputs[i].baseType == 'tuple') {
                values.push(JSON.parse(value ?? "{}"))
            } else if (type !== 'string') {
                if (typeof value == "string") {
                    value = value.replace(/^\s*|\s*$/g, '')
                }
                values.push(value)
            } else {
                values.push(value)
            }
            types.push(type)
        }
        const encode = abiCoder.encode(types, values);
        data = concat([data, encode])
    }
    return data
}

export const autoDecode = (hex: string): { type: string, value: any } => {
    if (!hex || hex === "" || hex === "0x" || hex.match(/^0x[a-fA-F0-9][a-fA-F0-9]{7}$/)) {
        return {type: "bytes32", value: hex}
    } else if (hex.match(/^0x0{24,25}[a-fA-F1-9][a-fA-F0-9]{38,39}$/)) {
        const result = abiCoder.decode(['address'], hex);
        return {type: "address", value: result[0]}
    }

    const result: bigint = getUint(hex)

    if (result < 9999999999n && result > 1000000000n) {
        return {type: "uint32", value: dayjs(Number(result) * 1000).format("YYYY-MM-DD HH:mm:ss")}
    }

    return {
        type: "uint256",
        value: result
    }
}

export const decode = (hex: string, types?: ParamType[]): ParamType[] => {
    if (hex == '0x') {
        return [
            {
                type: "bytes32",
                baseType: "bytes32",
                name: "结果",
                hash: "0x",
                value: "调用成功",
                fixed: true
            }
        ]
    }
    if (types && types.length > 0) {
        const result = abiCoder.decode(types.map(t => t.type), hex);
        for (let i = 0; i < types.length; i++) {
            types[i].value = result[i]
        }
        return types
    }
    types = []
    for (let i = 0; i < (hex.length - 2) / 64; i++) {
        const hash = "0x" + hex.slice(i * 64 + 2, (i + 1) * 64 + 2)
        const {type, value} = autoDecode(hash);
        types.push({
            type: type,
            baseType: type,
            hash: hash,
            value: value,
        })
    }
    return types
}

