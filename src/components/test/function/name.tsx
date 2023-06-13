import {AutoComplete, Button, Form, Input, Select, Space, Tooltip} from "antd";
import {ApiOutlined, CloseOutlined, SendOutlined} from "@ant-design/icons";
import React from "react";
import {ConsumerProps, ExplorerContext} from "@/components";
import type {FormInstance} from "antd/es/form/hooks/useForm";
import {generate} from "@/utils/function";

const types = [
    {label: "方法", value: "call"},
    {label: "存储", value: "slot"},
];

interface InputProps {
    type: string,
    loading?: boolean,
    form: FormInstance,
    onClose?: () => void,
    extend?: React.ReactNode
    debug?: boolean
}

const callParam = {
    type: "address",
    baseType: 'address',
    value: "",
    fixed: false
}

const slotParam = {
    type: "map",
    baseType: 'address',
    value: "",
    fixed: false
}

// 获取类型
const getInputType = (name?: string) => {
    if (!name || name == '') {
        return "call"
    }
    if (/^(stor)?\d+$/.test(name)) {
        return "slot"
    }
    return "call"
}

const Name = ({type, onClose, form, loading, debug}: InputProps) => {
    const {methods} = React.useContext<ConsumerProps>(ExplorerContext);

    const onComplete = (name: string) => {
        const input_type = getInputType(name)
        if (!debug) {
            if (input_type != type) {
                form.setFieldValue("type", input_type)
            }
            if (input_type == 'slot') {
                return
            }
        }
        try {
            const fra = generate(name);
            form.setFieldsValue(fra)
        } catch (e) {

        }
    }

    const addParams = () => {
        const key = type == 'slot' ? 'keys' : 'inputs'
        const params = form.getFieldValue(key) ?? []
        form.setFieldValue(key, [
            ...params,
            key == "keys" ? slotParam : callParam
        ])
    }

    return <>
        <Form.Item>
            <Space.Compact className={'aflex'} block>
                <Form.Item name={'type'} noStyle>
                    <Select
                        disabled={debug}
                        style={{width: '80px'}}
                        dropdownStyle={{zIndex: 99999}}
                        options={types}
                    />
                </Form.Item>
                <Form.Item
                    name={'name'}
                    noStyle
                >
                    <AutoComplete
                        allowClear
                        options={methods}
                        placeholder="请输入请求方法名称或签名"
                        onChange={onComplete}
                    />
                </Form.Item>
                <Tooltip title={'提交请求'}>
                    <Button
                        loading={loading}
                        icon={<SendOutlined/>}
                        onClick={form.submit}
                    />
                </Tooltip>
                <Tooltip title={'添加参数'}>
                    <Button
                        icon={<ApiOutlined/>}
                        onClick={addParams}
                    />
                </Tooltip>

                {
                    !debug && <Tooltip title={'删除'}>
                        <Button
                            icon={<CloseOutlined/>}
                            onClick={onClose}
                        />
                    </Tooltip>
                }
            </Space.Compact>
        </Form.Item>
        <Form.Item name={'signature_hash'} hidden={true}>
            <Input/>
        </Form.Item>
        <Form.Item name={'signature_text'} hidden={true}>
            <Input/>
        </Form.Item>
        <Form.Item name={'isHash'} hidden={true}>
            <Input/>
        </Form.Item>
        <Form.Item name={'outputs'} hidden={true}>
            <Input/>
        </Form.Item>
        <Form.Item name={'input'} hidden={true}>
            <Input/>
        </Form.Item>
    </>
}

export default Name