import {TestSwapIface} from "@/constant";
import {Response} from "@/types/tenderly/response";
import type {CallForm, Event, TradeColumn, TradeInfo, TradeResult} from "./typing";
import {checkAddress} from "@/components";
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

const toObject = <T>(v: any): T => {
    if (typeof v == 'object') {
        v = !v.toObject ? v : v.toObject()
        Object.keys(v).forEach((key) => {
            v[key] = toObject(v[key])
        })
    }
    return v
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
                error: `${resp.transaction.error_info.error_message}`,
            }
        ]
    }

    const sender = checkAddress(form.account);

    const names = {
        [sender]: 'SenderAccount',
        [TestAddress]: 'TestSwapContract',
        [form.tokenIn.address]: `${form.tokenIn.symbol}Token`,
        [form.tokenOut.address]: `${form.tokenOut.symbol}Token`,
    }

    const tokens = {
        [form.tokenIn.address]: form.tokenIn,
        [form.tokenOut.address]: form.tokenOut,
    }

    let results: TradeResult[] = [];

    if (form.count > 1) {
        results.push(...TestSwapIface.decodeFunctionResult("many", resp.transaction.transaction_info.call_trace.output)['results'])
    } else {
        results.push(TestSwapIface.decodeFunctionResult("one", resp.transaction.transaction_info.call_trace.output)['result'])
    }

    // 转化结构体
    results = results.map((value) => {
        names[value.pair] = `LP:${form.tokenIn.symbol}-${form.tokenOut.symbol}`
        tokens[value.pair] = {
            address: value.pair,
            decimals: 18,
            symbol: names[value.pair],
        }
        if (!names[value.account.account] && value.account.account != TestAddress) {
            names[value.account.account] = `TestAccount:${value.id}-${value.index}`
        }
        // 判断是否需要转账
        return toObject(value)
    })

    const buy: Event[] = []
    const sell: Event[] = []
    const transfer: Event[] = []

    // 获取处理日志信息
    if (resp.transaction.transaction_info.logs) {
        let index = 0
        resp.transaction.transaction_info.logs.forEach((value) => {
            if (value.raw.topics[0] == '0xd24646079e049d40989a6ef1838fece81cad58640453288addf8b6e5e0b475db') {
                index += 1
            }

            if (value.raw.topics[0] == '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
                const tokenAddress = checkAddress(value.raw.address)
                const formAddress = checkAddress(value.raw.topics[1])
                const toAddress = checkAddress(value.raw.topics[2])

                const log: Event = {
                    address: tokenAddress,
                    symbol: tokens[tokenAddress] ? tokens[tokenAddress].symbol : "未知",
                    decimals: tokens[tokenAddress] ? tokens[tokenAddress].decimals : 18,
                    amount: getUint(value.raw.data),
                    form: formAddress,
                    formTag: names[formAddress],
                    to: toAddress,
                    toTag: names[toAddress],
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

    const tradeInfo = (trade: TradeInfo, events: Event[]): TradeInfo => {
        return {
            ...trade,
            tokenIn: {
                ...trade.tokenIn,
                formTag: names[trade.tokenIn.formAddress],
                recipientTag: names[trade.tokenIn.recipientAddress],
            },
            tokenOut: {
                ...trade.tokenOut,
                formTag: names[trade.tokenOut.formAddress],
                recipientTag: names[trade.tokenOut.recipientAddress],
            },
            logs: events
        }
    }

    // 处理数组信息
    return results.map((result): TradeColumn => {

        return {
            ...result,
            key: `${resp.transaction.hash}-${result.id}-${result.index}`,
            tokenIn: form.tokenIn,
            tokenOut: form.tokenOut,
            buy: tradeInfo(result.buy, buy),
            sell: tradeInfo(result.sell, sell),
            transfer: tradeInfo(result.transfer, transfer),
            simulation: {
                fork_id: resp.simulation.fork_id,
                id: resp.simulation.id,
            }
        }
    }).reverse()
}