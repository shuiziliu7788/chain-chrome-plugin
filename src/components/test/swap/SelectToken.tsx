import {Select} from "antd";
import {getToken} from "./utils";
import {CSSProperties, useContext} from "react";
import {ConsumerProps, ExplorerContext, Token} from "@/components";


interface SelectToken {
    value?: Token,
    onChange?: (t: Token) => void
    style?: CSSProperties
}

const SelectToken = ({value, onChange, style}: SelectToken) => {
    const {explorer, setExplorer, contract} = useContext<ConsumerProps>(ExplorerContext);

    const tokens = contract.symbol == '' ? explorer.tokens : [
        {
            symbol: contract.symbol,
            address: contract.address,
            decimals: contract.decimals,
        },
        ...explorer.tokens
    ]

    const onSearch = async (address: string) => {
        if (typeof address != 'string' || !/^0x[0-9a-fA-F]{40}$/g.test(address.trim())) {
            return
        }
        try {
            const regExp = new RegExp(address, 'ig');
            const index = explorer.tokens.findIndex((t) => {
                return regExp.test(t.address)
            })
            if (index >= 0) {
                return
            }
            await setExplorer({
                ...explorer,
                tokens: [
                    await getToken(explorer.rpc, address),
                    ...explorer.tokens
                ].slice(0, 20)
            })
        } catch (e) {
            console.error(e)
        }
    }

    return <Select
        placeholder={'请输入代币地址'}
        style={style}
        value={value ? value.address : undefined}
        showSearch={true}
        onSearch={onSearch}
        fieldNames={{
            label: 'symbol',
            value: 'address',
        }}
        options={tokens}
        onSelect={(value, option) => {
            onChange && onChange(option)
            if (value == contract.address) {
                return
            }
            return setExplorer({
                ...explorer,
                tokens: [
                    option,
                    ...explorer.tokens.filter(t => t.address != value)
                ],
            })
        }}
    />
}

export default SelectToken