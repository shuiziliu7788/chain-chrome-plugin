import type {BigNumberish} from "ethers";
import type {Router, Token} from "@/components";

export interface Event {
    address: string
    symbol?: string
    decimals?: number
    form: string
    formTag?: string
    amount: bigint
    to: string
    toTag?: string
}

export interface TradeCall {
    router: string
    tokenIn: string
    tokenOut: string
    recipient: string
    buy: BigNumberish
    sell: BigNumberish
    transfer: BigNumberish
}

export interface TokenInfo {
    formAddress: string
    formTag: string
    formBeforeBalance: bigint
    formAfterBalance: bigint

    recipientAddress: string
    recipientTag: string
    recipientBeforeBalance: bigint
    recipientAfterBalance: bigint

    transferAmount: bigint
    tradeAmount: bigint
    recipientAmount: bigint
    reserveAmount: bigint

    gas: bigint
    fee: bigint

    isAddPair: boolean
    isSwap: boolean
    isBurn: boolean
}

export interface TradeInfo {
    state: bigint
    gas: bigint
    tokenIn: TokenInfo
    tokenOut: TokenInfo
    logs: Event[]
    error?: string
}

export interface Account {
    account: string
    balanceIn: bigint
    balanceOut: bigint
}

export interface TradeResult {
    id?: bigint
    index?: bigint
    pair?: string
    buy?: TradeInfo
    sell?: TradeInfo
    transfer?: TradeInfo
    account?: Account
    number?: bigint
    timestamp?: bigint
}

export interface TradeColumn extends TradeResult {
    key: string,
    simulation?: {
        fork_id: string,
        id: string,
    },
    tokenIn?: Token,
    tokenOut?: Token,
    error?: string,
}

export interface CallForm {
    router?: Router
    account?: string
    gasPrice?: string
    gas?: string
    tokenIn?: Token
    tokenOut?: Token
    amountBuy?: number
    amountSell?: number
    amountTransfer?: number
    amountIn?: BigNumberish
    amountOut?: BigNumberish
    recipient?: string
    quantity?: number
    count?: number
    block_header?: {
        number?: string
        timestamp?: string
    }
}