export const isBool = (val) => {
    return /^(true|false)$/.test(val)
}

export const isNumber = (val) => {
    return /^\d{1,78}$/.test(val)
}

export const isAddress = (val) => {
    return /^0x[0-9A-Fa-f]{40}$/.test(val)
}

export const isAddressArray = (val) => {
    return /^\["0x[0-9a-fA-F,x]+"\]$/.test(val)
}

export const isNumberArray = (val) => {
    return /^\[\d[\d,]*]$/.test(val)
}

export const isBoolArray = (val) => {
    return /^\[(true|false|,)*]$/.test(val)
}

export const isString = (val) => {
    return /^[A-Za-z0-9]+$/.test(val)
}

export const getType = (val):string => {
    if (isBool(val)) {
        return "bool"
    } else if (isNumber(val)) {
        return "uint256"
    } else if (isAddress(val)) {
        return "address"
    } else if (isNumberArray(val)) {
        return "uint256[]"
    } else if (isAddressArray(val)) {
        return "address[]"
    } else if (isBoolArray(val)) {
        return "bool[]"
    } else {
        return "string"
    }
}