
const {parseUnits, toBeHex} = require('ethers')

const aa = parseUnits('11',0)

console.log(aa)
console.log(aa.toString(16))
console.log(toBeHex(aa))

