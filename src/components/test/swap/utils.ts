import {TestSwapIface} from "@/constant";
import {Response} from "@/types/tenderly/response";
import type {CallForm, Event, TradeColumn, TradeResult} from "./typing";
import {checkAddress, Token} from "@/components";
import {getUint} from "ethers";

export const TestAddress: string = '0xBd770416a3345F91E4B34576cb804a576fa48EB1'

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

export const decode = (resp: Response, form: CallForm): TradeColumn[] => {

    if (resp.transaction.error_message) {
        return [
            {
                key: resp.transaction.hash,
                simulation: {
                    fork_id: resp.simulation.fork_id,
                    id: resp.simulation.id,
                },
                error: `${resp.transaction.error_info.error_message} form ${resp.transaction.error_info.address}`,
            }
        ]
    }

    const buy: Event[] = []
    const sell: Event[] = []
    const transfer: Event[] = []

    const names = {
        [TestAddress]: 'TestSwapContract',
        [form.tokenIn.address]: form.tokenIn.symbol,
        [form.tokenOut.address]: form.tokenOut.symbol,
    }

    if (resp.transaction.transaction_info.logs) {
        let index = 0
        resp.transaction.transaction_info.logs.forEach((value) => {
            if (value.raw.topics[0] == '0xd24646079e049d40989a6ef1838fece81cad58640453288addf8b6e5e0b475db') {
                index += 1
            }
            if (value.raw.topics[0] == '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
                const tokenAddress = checkAddress(value.raw.address);
                const token: Token = tokenAddress == form.tokenIn.address ? form.tokenIn : (tokenAddress == form.tokenOut.address ? form.tokenOut : {
                    address: tokenAddress,
                    symbol: '未知',
                    decimals: 18,
                })
                const log: Event = {
                    address: tokenAddress,
                    symbol: token.symbol,
                    decimals: token.decimals,
                    amount: getUint(value.raw.data),
                    form: checkAddress(value.raw.topics[1]),
                    to: checkAddress(value.raw.topics[2]),
                }
                if (index == 1) {
                    buy.push(log)
                } else if (index == 2) {
                    sell.push(log)
                } else if (index == 3) {
                    transfer.push(log)
                }
            }
        })
    }


    const output = resp.transaction.transaction_info.call_trace.output
    const results: TradeResult[] = [];

    if (form.count > 1) {
        results.push(...TestSwapIface.decodeFunctionResult("many", output)['results'])
    } else {
        results.push(TestSwapIface.decodeFunctionResult("one", output)['result'])
    }

    const toObject = <T>(v: any): T => {
        if (typeof v == 'object') {
            v = !v.toObject ? v : v.toObject()
            Object.keys(v).forEach((key) => {
                v[key] = toObject(v[key])
            })
        }
        return v
    }

    // 处理数组信息
    return results.map((result: any): TradeColumn => {
        result = toObject<TradeColumn>(result)
        result.buy.logs = buy
        result.sell.logs = sell
        result.transfer.logs = transfer
        return {
            ...result,
            key: `${resp.transaction.hash}-${result.id}-${result.index}`,
            tokenIn: form.tokenIn,
            tokenOut: form.tokenOut,
            simulation: {
                fork_id: resp.simulation.fork_id,
                id: resp.simulation.id,
            }
        }
    }).reverse()
}