import {tryBlockAndAggregate} from "@/utils/multicall";
import {AbiCoder, getNumber, getUint, toBeHex, zeroPadValue} from "ethers";
import {Router, Token} from "@/components";
import {TestSwapIface} from "@/constant";
import {FormatNumber} from "@/utils/number";
import dayjs from "dayjs";
import {Response} from "@/types/tenderly/response";
import {call} from "@/utils/eth";

export const abiCoder = AbiCoder.defaultAbiCoder()

export const TestAddress: string = '0xBd770416a3345F91E4B34576cb804a576fa48EB1'

export interface TokenInfo extends Token {
    fee?: string,
    before?: string,
    after?: string,
    amount?: string,
    tradeAmount?: string,
    reserve?: string,
    isAddPair?: boolean;
    isSwap?: boolean;
    isReserve?: boolean;
    gas?: number;
}

export interface TradeInfo {
    state: number,
    tokenIn: TokenInfo,
    tokenOut: TokenInfo,
    gas: number,
    error?: string,
}

export interface Swap {
    key: string,
    href?: string,
    id?: string,
    buy?: TradeInfo
    sell?: TradeInfo
    transfer?: TradeInfo
    tokenIn?: TokenInfo,
    tokenOut?: TokenInfo,
    recipient?: string,
    block_number?: number,
    block_timestamp?: number,
    time?: string,
    error?: string,
    simulation?: {
        fork_id?: string,
        id?: string,
    }
}

export const getToken = async (node: string, target: string): Promise<Token> => {
    const calls: any [] = [
        {
            target: target,
            callData: "0x06fdde03" //name
        },
        {
            target: target,
            callData: "0x95d89b41" //symbol
        },
        {
            target: target,
            callData: "0x313ce567" //decimals
        },
        {
            target: target,
            callData: "0x18160ddd" //totalSupply
        },
    ]
    const result = await tryBlockAndAggregate(node, calls)
    let token: Token = {
        address: target,
        symbol: "",
        decimals: 0,
    }
    for (let i = 0; i < result.returnData.length; i++) {
        const data = result.returnData[i]
        if (!data.success) {
            throw new Error("不是代币地址")
        }
        switch (i) {
            case 0:
                token.name = abiCoder.decode(['string'], data.returnData)[0].trim()
                break
            case 1:
                token.symbol = abiCoder.decode(['string'], data.returnData)[0].trim()
                break
            case 2:
                token.decimals = getNumber(data.returnData)
                break
            case 3:
                token.totalSupply = getUint(data.returnData).toString()
                break
        }
    }
    return token
}

export const getRouter = async (node: string, target: string): Promise<Router> => {
    const calls: any [] = [
        {
            target: target,
            callData: "0xad5c4648" //WETH
        },
        {
            target: target,
            callData: "0x4aa4a4fc" //WETH9
        }
    ]
    const result = await tryBlockAndAggregate(node, calls)
    const router: Router = {
        name: target,
        address: target,
        weth: "",
        version: 0,
    }
    for (let i = 0; i < result.returnData.length; i++) {
        const data = result.returnData[i]
        if (data.success) {
            const addr = abiCoder.decode(['address'], data.returnData)[0]
            switch (i) {
                case 0:
                    router.weth = addr
                    router.version = 2
                    break
                case 1:
                    router.weth = addr
                    router.version = 3
                    break
            }
        }
    }
    return router
}

export const encode = (values: any): string => {
    const input = {
        router: values.router.address,
        tokenIn: values.tokenIn.address,
        tokenOut: values.tokenOut.address,
        recipient: values.recipient,
        buy: values.amountBuy * 100,
        sell: values.amountSell * 100,
        transfer: values.amountTransfer * 100,
    }

    if (values.count > 1) {
        return TestSwapIface.encodeFunctionData("many", [Array.from({length: values.count}, () => input)])
    }

    return TestSwapIface.encodeFunctionData("one", [input])
}

export const analyzeTokenInfo = (tokenIn: Token, tokenOut: Token, info: any): TradeInfo => {
    return {
        state: Number(info.state),
        gas: Number(info.gas),
        tokenIn: {
            ...tokenIn,
            fee: (Number(info.tokenIn.fee) / 100).toFixed(2),
            tradeAmount: FormatNumber(info.tokenIn.tradeAmount, tokenIn.decimals),
            amount: FormatNumber(info.tokenIn.recipientAmount, tokenIn.decimals),
            reserve: FormatNumber(info.tokenIn.reserveAmount, tokenIn.decimals),
            isSwap: info.tokenIn.isSwap,
            isAddPair: info.tokenIn.isAddPair,
            isReserve: Number(info.tokenIn.reserveAmount) > 0,
            gas: Number(info.tokenIn.gas),
        },
        tokenOut: {
            ...tokenOut,
            fee: (Number(info.tokenOut.fee) / 100).toFixed(2),
            tradeAmount: FormatNumber(info.tokenOut.tradeAmount, tokenOut.decimals),
            amount: FormatNumber(info.tokenOut.recipientAmount, tokenOut.decimals),
            reserve: FormatNumber(info.tokenOut.reserveAmount, tokenOut.decimals),
            isSwap: info.tokenOut.isSwap,
            isAddPair: info.tokenOut.isAddPair,
            isReserve: Number(info.tokenOut.reserveAmount) > 0,
            gas: Number(info.tokenOut.gas),
        },
        error: info.error,
    }
}


export const decode = (resp: Response, fields: any): Swap[] => {
    const tokenIn: Token = fields['tokenIn'] ?? {}
    const tokenOut: Token = fields['tokenOut'] ?? {}
    const output = resp.transaction.transaction_info.call_trace.output
    let results = [];

    if (fields.count > 1) {
        results = TestSwapIface.decodeFunctionResult("many", output)['results']
    } else {
        results = [TestSwapIface.decodeFunctionResult("one", output)['result']]
    }

    return results.map(result => {
        const data: Swap = {
            key: `${result.id}-${result.index}-${Math.random()}`,
            id: `${result.id}-${result.index}`,
            buy: analyzeTokenInfo(tokenIn, tokenOut, result.buy.toObject()),
            sell: analyzeTokenInfo(tokenOut, tokenIn, result.sell.toObject()),
            transfer: analyzeTokenInfo(tokenOut, tokenOut, result.transfer.toObject()),
            block_number: Number(result.blockNumber),
            block_timestamp: Number(result.blockTimestamp),
            tokenIn: {
                ...tokenIn,
                amount: FormatNumber(result.account.balanceIn, tokenIn.decimals),
            },
            tokenOut: {
                ...tokenOut,
                amount: FormatNumber(result.account.balanceOut, tokenOut.decimals),
            },
            recipient: result.account.account,
            simulation: {
                fork_id: resp.simulation.fork_id,
                id: resp.simulation.id,
            },
            time: dayjs(Number(result.blockTimestamp) * 1000).format("YYYY-MM-DD HH:mm:ss")
        }

        data.tokenIn.isSwap = data.sell.tokenOut.isSwap;
        data.tokenIn.isReserve = data.sell.tokenOut.isReserve;
        data.tokenIn.isAddPair = data.sell.tokenOut.isAddPair;

        data.tokenOut.isSwap = data.sell.tokenIn.isSwap;
        data.tokenOut.isReserve = data.sell.tokenIn.isReserve;
        data.tokenOut.isAddPair = data.sell.tokenIn.isAddPair;

        return data
    }).reverse()
}