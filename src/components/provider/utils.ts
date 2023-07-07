import {Storage} from "@plasmohq/storage";
import {Contract, Explorer, Router} from "@/components";
import {Call, tryBlockAndAggregate} from "@/utils/multicall";
import {AbiCoder, getAddress, getNumber, getUint, toBeHex} from "ethers";
import request from "@/utils/request";
import type {Dict, Token} from "./typing";
import {getTransactionReceipt} from "@/utils/eth";
import {address} from "@/utils/regexp";

export const storage = new Storage()
export const abiCoder = AbiCoder.defaultAbiCoder()


const Transfer: string = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
const PairCreated: string = "0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9"


export const unique = <T>(arr: T[], key: string): T[] => {
    const map = new Map()
    return arr.filter((item) => !map.has(item[key]) && map.set(item[key], true))
}

export const checkAddress = (addr: string): string => {
    return getAddress(toBeHex(addr, 20))
}

export const getPageAddress = (): string => {
    const s = address(document.location.href);
    try {
        return checkAddress(s)
    } catch (e) {

    }
    return undefined
}

export const hexToString = (hex: string): string => {
    return abiCoder.decode(['string'], hex)[0]
}

export const getContractInfo = async (node: string, addr: string): Promise<Contract> => {
    addr = checkAddress(addr)
    const calls: Call [] = [
        {
            target: "0xcA11bde05977b3631167028862bE2a173976CA11",
            callData: "0x3408e470" // getChainId
        },
        {
            target: addr,
            callData: "0x06fdde03" //name
        },
        {
            target: addr,
            callData: "0x95d89b41" //symbol
        },
        {
            target: addr,
            callData: "0x313ce567" //decimals
        },
    ]

    const dicts = (await storage.get<Dict[]>("dict")) ?? []

    if (Array.isArray(dicts)){
        calls.push(...dicts.map((value) => {
            return {
                target: addr,
                callData: value.value
            }
        }))
    }

    const result = await tryBlockAndAggregate(node, calls)

    const contract: Contract = {
        block_number: Number(result.blockNumber),
        chain_id: 0,
        suggestion_address: []
    }

    const token: Token = {
        decimals: 0,
        symbol: "",
        address: addr
    }

    for (let i = 0; i < result.returnData.length; i++) {
        const returnData = result.returnData[i]
        if (!returnData.success) {
            continue
        }
        try {
            switch (i) {
                case 0:
                    contract.chain_id = getNumber(returnData.returnData)
                    break
                case 1:
                    token.name = hexToString(returnData.returnData)
                    break
                case 2:
                    token.symbol = hexToString(returnData.returnData)
                    break
                case 3:
                    token.decimals = getNumber(returnData.returnData)
                    break
                default:
                    const adr = checkAddress(returnData.returnData)
                    const dict = dicts[i - 4]
                    if (!contract[dict.type]) {
                        contract[dict.type] = adr
                    }
                    contract.suggestion_address.push({
                        label: dict.label,
                        value: adr
                    })
            }
        } catch (e) {

        }
    }

    contract.suggestion_address = unique([
        {
            label: token.symbol ?? addr,
            value: addr
        },
        ...contract.suggestion_address
    ], 'value')

    contract.token = token.symbol != "" ? token : undefined

    return contract
}

export const getTokenInfo = async (node: string, target: string): Promise<Token> => {
    const calls: any [] = [
        {
            target: target,
            callData: "0x06fdde03" // name
        },
        {
            target: target,
            callData: "0x95d89b41" // symbol
        },
        {
            target: target,
            callData: "0x313ce567" // decimals
        },
        {
            target: target,
            callData: "0x18160ddd" // totalSupply
        },
    ]
    const result = await tryBlockAndAggregate(node, calls)
    const token: Token = {
        address: checkAddress(target),
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
                token.name = hexToString(data.returnData).trim()
                break
            case 1:
                token.symbol = hexToString(data.returnData).trim()
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

export const getRouterInfo = async (node: string, target: string): Promise<Router> => {
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
            const addr = checkAddress(data.returnData)
            router.weth = addr
            switch (i) {
                case 0:
                    router.version = 2
                    break
                case 1:
                    router.version = 3
                    break
            }
            break
        }
    }
    if (router.weth == ""){
        throw new Error(`${target}不是路由地址`)
    }
    return router
}

export interface CreationTransaction {
    creator: string
    hash: string
    pools: Token[]
}

export const getCreationTransaction = async (explorer: Explorer, address: string): Promise<CreationTransaction> => {
    const {result} = await request<any>({
        host: explorer.developer_host,
        method: 'GET',
        params: {
            module: "contract",
            action: "getcontractcreation",
            contractaddresses: address,
            apikey: explorer.secret_key ?? '',
        }
    })

    const hash = result[0].txHash

    let creator = checkAddress(result[0].contractCreator)

    const pairAddress: string[] = []

    const pools: Token[] = []

    const transaction = await getTransactionReceipt(explorer.rpc, hash)

    if (transaction) {
        transaction.logs.forEach((log) => {
            if (log.address == address && log.topics[0] == Transfer) {
                // 创建者
                creator = checkAddress(log.topics[2])
            } else if (log.topics[0] == PairCreated) {
                const token0 = checkAddress(log.topics[1])
                const token1 = checkAddress(log.topics[2])
                pairAddress.push(token0 == address ? token1 : token0)
            }
        })
    }

    for (let i = 0; i < pairAddress.length; i++) {
        try {
            const token = explorer.tokens.find((t) => t.address == pairAddress[i]);
            if (token) {
                pools.push(token)
                continue;
            }
            // 获取TOKEN信息
            pools.push(await getTokenInfo(explorer.rpc, pairAddress[i]))
        } catch (e) {
            console.error(e)
        }
    }

    return {
        hash,
        creator,
        pools,
    }
}

export let currentAddress: string = getPageAddress()