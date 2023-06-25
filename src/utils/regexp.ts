export const addressRegExp = /(0x[0-9a-fA-F]{40})/g
export const hashRegExp = /(0x[0-9a-fA-F]{64})/g
export const addressPageRegExp = /\/address\/(0x[0-9a-fA-F]{40})/gi
export const tokenPageRegExp = /\/token\/(0x[0-9a-fA-F]{40})/gi
export const txContractPageRegExp = /\/tx\/(0x[0-9a-fA-F]{64})/gi
export const readContractPageRegExp = /\/readContract/gi
export const extensionPageRegExp = /chrome-extension/gi
export const signatureRegExp = /^0x[0-9A-Fa-f]{8}$/
export const signatureWithDataRegExp = /^0x[0-9A-Fa-f]{9,}$/
export const functionNameRegExp = /^[a-zA-Z$_][a-zA-Z0-9$_]*$/

export const address = (str: string): string => {
    return match(addressRegExp, str)
}

export const hash = (str: string): string => {
    return match(hashRegExp, str)
}

export const match = (regExp: RegExp, str: string): string | undefined => {
    if (typeof str === 'string' && regExp.test(str)) {
        return str.match(regExp)[0]
    }
    return undefined
}