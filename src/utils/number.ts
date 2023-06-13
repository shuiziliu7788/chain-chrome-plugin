import BigNumber from "bignumber.js";

type Number = number | bigint | string | BigNumber | any


export const FormatNumber = (amount: Number, digits: Number = 0): string => {
    const number = new BigNumber(amount).div(new BigNumber(10).pow(digits)).abs()
    if (number.isNaN() || number.isZero()) {
        return "0"
    }
    const de = number.toNumber()
    if (de == 0) {
        return "0"
    } else if (de <= 1e-4) {
        let e = Math.ceil(Math.log10(0.1 / de));
        return number
            .dp(e + 3, 1)
            .toFormat()
            .replace(new RegExp(`0{${e}}`), `0{${e}}`);
    } else if (de <= 1e-3) {
        return number.dp(4, 1).toFormat()
    } else if (de <= 1) {
        return number.dp(3, 1).toFormat()
    }
    return number.dp(3, 1).toFormat()
}


