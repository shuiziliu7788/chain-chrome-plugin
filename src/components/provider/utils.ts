import {Storage} from "@plasmohq/storage";
import type {Dict} from "@/components";
import {tryBlockAndAggregate} from "@/utils/multicall";
import {AbiCoder, getNumber} from "ethers";



const abiCoder = AbiCoder.defaultAbiCoder()
const storage = new Storage()

export const info = async (node: string, addr: string) => {
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

    let contract: any = {
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
                    contract.name =  abiCoder.decode(['string'],returnData.returnData)[0]
                    break
                case 2:
                    contract.symbol = abiCoder.decode(['string'],returnData.returnData)[0]
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
                            label: `${name}(${adr.slice(0, 10) + "****" + adr.slice(-10)})`,
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





