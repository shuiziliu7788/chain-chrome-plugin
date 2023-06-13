import request from "@/utils/request";
import {parseUnits} from "ethers";


type HexString = string

export interface Transaction {
    from?: string
    to: string
    value?: string
    data?: string
    gas?: string
    gasPrice?: string
}

export interface Result {
    id: number
    error?: {
        code: number
        message: string
    }
    result: string

}

const rpc = async (host: string, method: string, params?: any): Promise<any> => {
    const resp = await request<Result>({
        host,
        method: 'POST',
        data: {
            "id": 0,
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
        },
        header: {
            'Content-Type': 'application/json',
        }
    })
    if (resp.error) {
        throw new Error(resp.error.message)
    }
    return resp
}

export const call = (node: string, transaction: Transaction): Promise<HexString> => {
    ["gasPrice", "value", "gas"].forEach((key) => {
        if (!transaction[key] || transaction[key] === '' || transaction[key] <= 0) {
            delete transaction[key]
            return
        }
        const decimals = key === 'value' ? 18 : key === 'gasPrice' ? 9 : 4
        transaction[key] = "0x" + parseUnits(transaction[key], decimals).toString(16)
    });
    return rpc(node, "eth_call", [transaction, "latest"]).then<HexString>((resp: Result) => (resp.result))
}

export const getStorageAt = (node: string, address: string, key: string) => {
    return rpc(node, "eth_getStorageAt", [address, key, "latest"]).then<HexString>((resp: Result) => (resp.result))
}

export const estimateGas = (node, transaction) => {
    return rpc(node, "eth_estimateGas", [transaction, "latest"])
}

export const getCode = (node, address) => {
    return rpc(node, "eth_getCode", [address, "latest"])
}
