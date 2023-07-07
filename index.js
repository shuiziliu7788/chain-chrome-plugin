const {getCreateAddress} = require("ethers")


for (let i = 0; i < 99; i++) {
    console.log(getCreateAddress({
        from: "0xBd770416a3345F91E4B34576cb804a576fa48EB1",
        nonce: i
    }))
}