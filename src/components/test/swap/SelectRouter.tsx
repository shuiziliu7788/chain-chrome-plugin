import {Input, Select, Space} from "antd";
import {getRouter} from "./utils";
import React, {useContext, useEffect} from "react";
import {ConsumerProps, ExplorerContext, Router} from "@/components";


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
            const regExp = new RegExp(address, 'ig');
            const index = explorer.router.findIndex((t) => {
                return regExp.test(t.address)
            })
            if (index >= 0) {
                return
            }
            await setExplorer({
                ...explorer,
                router: [
                    await getRouter(explorer.rpc, address),
                    ...explorer.router
                ].slice(0, 20)
            })
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        if (value && value.version == undefined) {
            onSearch(value.address).catch(r => {
                console.log(r)
            })
        }
    }, [value])

    return <Space.Compact className={'aflex'} block>
        <Input disabled value={'路由'}/>
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