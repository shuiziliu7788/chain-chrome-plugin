import code from "./code.json"
import {Interface} from "ethers";

export const TestSwapCode = "0x" + code.data.bytecode.object

export interface Swap {
    router: string
    tokenIn: string
    tokenOut: string
    buy: number
    sell: number
    transfer: number
}

export const TestSwapIface = new Interface(code.abi);