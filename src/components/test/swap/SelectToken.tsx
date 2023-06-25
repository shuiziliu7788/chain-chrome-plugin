import {Select} from "antd";
import {CSSProperties, useContext} from "react";
import {checkAddress, ConsumerProps, ExplorerContext, getTokenInfo, Token} from "@/components";


interface SelectToken {
    value?: Token,
    onChange?: (t: Token) => void
    style?: CSSProperties
}

const SelectToken = ({value, onChange, style}: SelectToken) => {
    const {explorer, setExplorer, contract} = useContext<ConsumerProps>(ExplorerContext);

    const onSearch = async (address: string) => {
        if (typeof address != 'string' || !/^0x[0-9a-fA-F]{40}$/g.test(address.trim())) {
            return
        }
        try {
            address = checkAddress(address)
            if (explorer.tokens.findIndex((t) => t.address == address) >= 0) {
                return
            }
            const token = await getTokenInfo(explorer.rpc, address)
            await setExplorer({
                ...explorer,
                tokens: [token, ...explorer.tokens].slice(0, 6)
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
        options={contract.token ? [contract.token, ...explorer.tokens] : explorer.tokens}
        onSelect={(value, option) => {
            onChange && onChange(option)
            if (contract.token && contract.token.address == value) {
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