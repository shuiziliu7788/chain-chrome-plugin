import {Button, Card, Form, Input, Space, Typography} from "antd";
import {abiCoder, encode, Func, generate} from "@/utils/function";
import {CheckOutlined, SnippetsOutlined} from "@ant-design/icons";
import Inputs from "@/components/test/function/param";
import React, {useState} from "react";

const {Paragraph} = Typography

export const ABI = () => {
    const [form] = Form.useForm();
    const [fragment, setFragment] = useState<Func>();
    const onNameChange = (e) => {
        try {
            let fra: Func = generate(e.target.value);
            let inputs = fra.inputs
            try {
                if (inputs.length > 0) {
                    const defaultValue = abiCoder.getDefaultValue(fra.inputs.map(item => item.type));
                    for (let i = 0; i < inputs.length; i++) {
                        if (inputs[i].baseType == "array" || inputs[i].baseType == "tuple") {
                            inputs[i].value = JSON.stringify(defaultValue[i])
                        } else {
                            inputs[i].value = defaultValue[i]
                        }
                    }
                }
                form.setFieldValue("inputs", inputs)
                fra.inputs = inputs;
                fra.input = encode(fra);
            } catch (e) {
                console.error(e)
            }
            setFragment(fra)
        } catch (e) {
            setFragment({
                input: e.toString(),
                signature_hash: e.toString(),
            })
        }
    }

    return <Card
        className={'tool-card'}
    >
        <Form
            form={form}
            onValuesChange={(v, a) => {
                if (v.inputs) {
                    try {
                        fragment.inputs = a.inputs
                        fragment.input = ""
                        fragment.input = encode(fragment);
                        setFragment({...fragment})
                    } catch (e) {
                        fragment.input = e.toString()
                        setFragment({...fragment})
                    }
                }
            }}
        >
            <Form.Item name={'name'}>
                <Input.TextArea
                    allowClear
                    placeholder={'请输入函数体'}
                    rows={3}
                    onChange={onNameChange}
                />
            </Form.Item>

            <Form.Item>
                <Space.Compact className={'flex'}>
                    <Button disabled className={'w80'}>签名ID</Button>
                    <Form.Item noStyle>
                        <Input
                            value={fragment ? fragment.signature_hash : ""}
                            disabled
                        />
                    </Form.Item>
                    <Paragraph
                        style={{display: 'inline-block', width: 32, marginBottom: 0}}
                        copyable={{
                            tooltips: false,
                            text: fragment ? `${fragment.signature_text} ${fragment.signature_hash}` : "",
                            icon: [<Button icon={<SnippetsOutlined/>}/>, <Button icon={<CheckOutlined/>}/>]
                        }}/>
                </Space.Compact>
            </Form.Item>

            <Form.List name={'inputs'}>
                {
                    (fields) => {
                        return fields.map(field => {

                            return <Form.Item
                                key={field.key}
                                name={field.name}
                            >
                                <Inputs
                                    type={'call'}
                                />
                            </Form.Item>
                        })
                    }
                }
            </Form.List>

            <Form.Item>
                <Space.Compact className={'flex'}>
                    <Button disabled className={'w80'}>数据</Button>
                    <Form.Item noStyle>
                        <Input
                            value={fragment ? fragment.input : ""}
                            disabled
                        />
                    </Form.Item>
                    <Paragraph
                        style={{display: 'inline-block', width: 32, marginBottom: 0}}
                        copyable={{
                            tooltips: false,
                            text: fragment ? fragment.input : "",
                            icon: [<Button icon={<SnippetsOutlined/>}/>, <Button icon={<CheckOutlined/>}/>]
                        }}/>
                </Space.Compact>
            </Form.Item>
        </Form>
    </Card>
}

export default ABI