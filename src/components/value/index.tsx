import type {ParamType} from "@/utils/function";
import {Button, Form, Input, Select, Space, Typography} from "antd";
import {useEffect, useState} from "react";
import {CheckOutlined, SnippetsOutlined} from "@ant-design/icons";
import {AbiCoder} from "ethers";
import dayjs from "dayjs";

const {Paragraph} = Typography

const abiCoder = AbiCoder.defaultAbiCoder()

interface HashValueProps {
    index: number
    value: ParamType
}

const typeOptions = [
    {label: "地址", value: "address"},
    {label: "数字", value: "uint256"},
    {label: "时间", value: "uint32"},
    {label: "哈希", value: "bytes32"},
]

export const Value = (props: HashValueProps) => {
    const [value, setValue] = useState(props.value);

    useEffect(() => {
        setValue(props.value)
    }, [props.value])

    const onChangeType = (type) => {
        try {
            let val = abiCoder.decode([type], value.hash)[0];
            if (type == 'uint32') {
                val = dayjs(Number(val * 1000n)).format("YYYY-MM-DD HH:mm:ss")
            }
            setValue((p) => {
                return {...p, value: val, type: type, error: false}
            })
        } catch (e) {
            setValue((p) => {
                return {...p, value: e.toString(), error: true, type: type}
            })
        }
    }

    return <Form.Item style={{width: '100%'}}>
        <Space.Compact className={'flex'} size={'middle'} block>
            {
                value.name && <Input
                    disabled
                    className={'w80'}
                    value={value.name}
                />
            }
            {
                !value.fixed && <Select
                    className={'w80'}
                    value={value.type}
                    options={typeOptions}
                    onChange={onChangeType}
                />
            }
            <Input
                className={'auto'}
                disabled
                value={value.value}
            />
            <Paragraph
                style={{display: 'inline-block', width: "32px", marginBottom: 0}}
                copyable={{
                    tooltips: false,
                    text: value.value,
                    icon: [<Button icon={<SnippetsOutlined/>}/>, <Button icon={<CheckOutlined/>}/>]
                }}/>
        </Space.Compact>
    </Form.Item>
}

export default Value