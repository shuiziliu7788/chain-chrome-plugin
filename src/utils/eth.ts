import request from "@/utils/request";
import {parseUnits,getCreate2Address} from "ethers";
import type {TransactionReceiptParams} from "ethers/src.ts/providers/formatting";




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
    result: any
}

const rpc = async <T>(host: string, method: string, params?: any): Promise<T> => {
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
    return resp.result
}

export const call = (node: string, transaction: Transaction): Promise<string> => {
    ["gasPrice", "value", "gas"].forEach((key) => {
        if (!transaction[key] || transaction[key] === '' || transaction[key] <= 0) {
            delete transaction[key]
            return
        }
        const decimals = key === 'value' ? 18 : key === 'gasPrice' ? 9 : 4
        transaction[key] = "0x" + parseUnits(transaction[key], decimals).toString(16)
    });

    return rpc<string>(node, "eth_call", [transaction, "latest"])
}

export const getStorageAt = (node: string, address: string, key: string): Promise<string> => {
    return rpc<string>(node, "eth_getStorageAt", [address, key, "latest"])
}

export const getTransactionReceipt = (node: string, hash: string): Promise<TransactionReceiptParams> => {
    return rpc<any>(node, "eth_getTransactionReceipt", [hash])
}