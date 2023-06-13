import React, {useContext, useState} from "react";
import type {ParamType} from "@/utils/function";
import {AutoComplete, Button, Space, Tooltip} from "antd";
import {getType} from "@/utils/types";
import {MinusOutlined, PlusOutlined} from "@ant-design/icons";
import {ConsumerProps, ExplorerContext} from "@/components";


interface InputsProps {
    add?: () => void
    remove?: () => void
    onChange?: any
    value?: ParamType
    type?: string
}

const callType = [
    {
        value: 'uint256',
        label: 'uint256',
        baseType: "uint256"
    },
    {
        value: 'address',
        label: 'address',
        baseType: "address"
    },
    {
        value: 'bool',
        label: 'bool',
        baseType: "bool"
    },
    {
        value: 'uint8',
        label: 'uint8',
        baseType: "uint8"
    },
    {
        value: 'string',
        label: 'string',
        baseType: "string"
    },
    {
        value: 'address[]',
        label: 'address[]',
        baseType: "array"
    },
    {
        value: 'uint256[]',
        label: 'uint256[]',
        baseType: "array"
    },
]

const slotType = [
    {
        value: 'map',
        label: 'map',
        baseType: "address"
    },
    {
        value: 'array',
        label: 'array',
        baseType: "uint256"
    },
    {
        value: 'index',
        label: 'index',
        baseType: "uint256"
    },
]

const Param = ({onChange, value, add, remove, type}: InputsProps) => {
    const {contract} = useContext<ConsumerProps>(ExplorerContext);
    const [select, setSelect] = useState(false);

    return <Space.Compact block>
        <AutoComplete
            value={value.type}
            options={type === 'slot' ? slotType : callType}
            disabled={value.fixed}
            style={{minWidth: '80px', width: '80px'}}
            onChange={(val: string, option: any) => {
                onChange({...value, type: val, baseType: option.baseType})
                setSelect(true)
            }}
        />

        <AutoComplete
            allowClear
            value={value.value}
            placeholder={type === 'slot' ? "请输入KEY" : `请输入${value.name ?? '参数'}`}
            options={value.baseType == 'address' ? contract.suggestion_address : []}
            onChange={(val: string, option: any) => {
                if (type == 'call' && !value.fixed && !select) {
                    value.baseType = getType(val)
                }
                onChange({...value, value: val})
            }}
        />

        {
            !value.fixed && <>
                <Tooltip title={'追加参数'}>
                    <Button
                        icon={<PlusOutlined/>}
                        onClick={add}
                    />
                </Tooltip>
                <Tooltip title={'删除参数'}>
                    <Button
                        icon={<MinusOutlined/>}
                        onClick={remove}
                    />
                </Tooltip>
            </>
        }
    </Space.Compact>
}

export default Param