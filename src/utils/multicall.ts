import {address, multiCallIface} from "@/constant/multicall";
import {call} from "@/utils/eth";

const keys = ["symbol", "decimals", "owner", "uniswapPair", "uniswapV2Pair", "_mainPair", "uniswapV2Router"]

interface addr {
    label: string,
    value: string
}

interface ContractInfo {
    blockNumber: number
    chain_id: number
    symbol?: string,
    decimals?: number,
    suggestion_address: addr[]
}

export interface Call {
    target: string
    callData: string
}

export interface Return {
    blockNumber: bigint,
    returnData: {
        success: boolean,
        returnData: string,
    }[]
}

export const tryBlockAndAggregate = async (node: string, calls: Call[]): Promise<Return> => {
    const data = await call(node, {
        to: address,
        data: multiCallIface.encodeFunctionData("tryBlockAndAggregate", [false, calls])
    })

    // @ts-ignore
    return multiCallIface.decodeFunctionResult("tryBlockAndAggregate", data);
}