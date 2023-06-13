import {concat, getUint, keccak256, toBeHex, zeroPadValue} from "ethers";
import type {ParamType} from "@/utils/function";

export const mapLocation = (slot: string, key: string): string => {
    const con = [zeroPadValue(key, 32), zeroPadValue(slot, 32)]
    return keccak256(concat(con))
}

export const arrLocation = (slot: string, index: number, elementSize: number): string => {
    const big = getUint(keccak256(zeroPadValue(slot, 32)))
    return zeroPadValue(toBeHex(big + getUint(index * elementSize)), 32)
}

export const indexLocation = (slot: string, index: number): string => {
    return zeroPadValue(toBeHex(getUint(slot) + getUint(index)), 32)
}

export const storage = (slot: string, keys?: ParamType[]): string => {
    slot = toBeHex(slot.replace("stor", ""))
    if (!keys || keys.length == 0) {
        return zeroPadValue(slot, 32)
    }
    keys.forEach((item) => {
        if (item.type == "map") {
            slot = mapLocation(slot, toBeHex(item.value))
        } else if (item.type == "array") {
            slot = arrLocation(slot, Number(item.value), 1)
        } else if (item.type == "index") {
            slot = indexLocation(slot, Number(item.value))
        }
    })
    return slot
}