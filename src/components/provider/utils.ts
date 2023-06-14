import {Storage} from "@plasmohq/storage";
import type {Dict} from "@/components";
import {Contract, Explorer} from "@/components";
import {tryBlockAndAggregate} from "@/utils/multicall";
import {AbiCoder, getNumber} from "ethers";
import request from "@/utils/request";
import {getTransactionReceipt} from "@/utils/eth";

const abiCoder = AbiCoder.defaultAbiCoder()
const storage = new Storage()

const special = {
    'scan.pego.network': 'https:/scan.pego.network/api',
}

const Transfer: string = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
const PairCreated: string = "0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9"

export const host = (): string => {
    return special[location.host] ?? `https://api.${location.host}/api`
}

export const info = async (node: string, addr: string): Promise<Contract> => {
    const calls: any [] = [
        {
            target: "0xcA11bde05977b3631167028862bE2a173976CA11",
            callData: "0x3408e470" //getChainId
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
    const dict = await storage.get<Dict>("dict")
    const owner = Array.isArray(dict['owner']) ? dict['owner'] : []
    calls.push(...owner.map(m => {
        return {
            target: addr,
            callData: m.id
        }
    }))
    const pair = Array.isArray(dict['pair']) ? dict['pair'] : []
    calls.push(...pair.map(m => {
        return {
            target: addr,
            callData: m.id
        }
    }))
    const router = Array.isArray(dict['router']) ? dict['router'] : []
    calls.push(...router.map(m => {
        return {
            target: addr,
            callData: m.id
        }
    }))

    const result = await tryBlockAndAggregate(node, calls)

    const contract: any = {
        blockNumber: Number(result.blockNumber),
        chain_id: 0,
        suggestion_address: []
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
                    contract.name = abiCoder.decode(['string'], returnData.returnData)[0]
                    break
                case 2:
                    contract.symbol = abiCoder.decode(['string'], returnData.returnData)[0]
                    break
                case 3:
                    contract.decimals = getNumber(returnData.returnData)
                    break
                default:
                    const adr = abiCoder.decode(['address'], returnData.returnData)[0]
                    let name = ""
                    if (i < owner.length + 4) {
                        if (!contract.owner) {
                            contract.owner = adr
                        }
                        name = owner[i - 4].label
                    } else if (i < pair.length + owner.length + 4) {
                        if (!contract.pair) {
                            contract.pair = adr
                        }
                        name = pair[i - 4 - owner.length].label
                    } else {
                        if (!contract.router) {
                            contract.router = adr
                        }
                        name = router[i - 4 - pair.length - owner.length].label
                    }
                    if (!contract.suggestion_address.map(su => su.value).includes(adr)) {
                        contract.suggestion_address.push({
                            label: `${name}`,
                            value: adr
                        })
                    }
            }
        } catch (e) {

        }
    }

    contract.suggestion_address = [
        {
            label: contract.symbol ? `${contract.symbol}(${addr.slice(0, 10) + "****" + addr.slice(-10)})` : addr,
            value: addr
        },
        ...contract.suggestion_address
    ]
    return contract
}

interface CreationTransaction {
    creator: string,
    pair: string[],
    hash: string
}

export const getCreationTransaction = (explorer: Explorer, address: string): Promise<CreationTransaction> => {
    return new Promise(async (resolve, reject) => {
        try {
            const {result} = await request<any>({
                host: host(),
                method: 'GET',
                params: {
                    module: "contract",
                    action: "getcontractcreation",
                    contractaddresses: address,
                    apikey: explorer.secret_key ?? '',
                }
            })
            const hash = result[0].txHash
            let creator = result[0].contractCreator
            const pair: string[] = []
            const transaction = await getTransactionReceipt(explorer.rpc, hash)
            transaction.logs.forEach((log) => {
                if (log.address == address && log.topics[0] == Transfer) {
                    // 创建者
                    creator = abiCoder.decode(['address'], log.topics[2])[0]
                } else if (log.topics[0] == PairCreated) {
                    // 创建池子
                    const token0 = abiCoder.decode(['address'], log.topics[1])[0]
                    const token1 = abiCoder.decode(['address'], log.topics[2])[0]
                    pair.push(token0 == address ? token1 : token0)
                }
            })
            return {
                hash,
                creator,
                pair,
            }
        } catch (e) {
            reject(e)
        }
    })
}