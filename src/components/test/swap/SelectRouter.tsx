import {Button, Select, Space} from "antd";
import React, {useContext} from "react";
import {checkAddress, ConsumerProps, ExplorerContext, getRouterInfo, Router} from "@/components";


interface SelectRouter {
    value?: Router,
    onChange?: (r: Router) => void
}

const SelectRouter = ({value, onChange}: SelectRouter) => {
    const {explorer, setExplorer} = useContext<ConsumerProps>(ExplorerContext);

    const onSearch = async (address: string) => {
        if (typeof address != 'string' || !/^0x[0-9a-fA-F]{40}$/g.test(address.trim())) {
            return
        }
        try {
            address = checkAddress(address)
            if (explorer.router.findIndex(t => t.address == address) >= 0) {
                return
            }
            const router = await getRouterInfo(explorer.rpc, address)
            await setExplorer({
                ...explorer,
                router: [router, ...explorer.router].slice(0, 5)
            })
        } catch (e) {
            console.error(e)
        }
    }

    return <Space.Compact className={'flex'} block>
        <Button disabled className={'w80'}>路由</Button>
        <Select
            placeholder={'请输入路由地址'}
            value={value ? value.address : undefined}
            showSearch={true}
            onSearch={onSearch}
            fieldNames={{
                label: 'name',
                value: 'address',
            }}
            options={explorer.router}
            onSelect={(value, option) => {
                onChange && onChange(option)
                return setExplorer({
                    ...explorer,
                    router: [
                        option,
                        ...explorer.router.filter(t => t.address != value)
                    ],
                })
            }}
        />
    </Space.Compact>
}

export default SelectRouter