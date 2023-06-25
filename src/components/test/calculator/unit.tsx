import {Button, Form, Input, InputNumber, Space, Typography} from "antd";
import {CheckOutlined, SnippetsOutlined} from "@ant-design/icons";
import React, {useEffect, useState} from "react";
import {FormatNumber} from "@/utils/number";
import {ConsumerProps, ExplorerContext} from "@/components/provider";

const {Paragraph} = Typography

const Unit = () => {
    const {contract} = React.useContext<ConsumerProps>(ExplorerContext);
    const [digits, setDigits] = useState<number>(18);
    const [amount, setAmount] = useState<string>("");
    const [bnb, setBnb] = useState<any>("0");
    const [wei, setWei] = useState<any>("0");

    useEffect(() => {
        try {
            setBnb(FormatNumber(amount, digits))
        } catch (e) {
            console.error(e)
        }
        try {
            setWei(FormatNumber(amount, -digits))
        } catch (e) {
            console.error(e)
        }
    }, [digits, amount])

    useEffect(() => {
        if (contract.token) {
            setDigits(contract.token.decimals)
        }
    }, [contract.token])


    return <>
        <Form.Item>
            <Space.Compact block>
                <Form.Item noStyle>
                    <Input
                        value={amount}
                        allowClear
                        style={{width: 'calc(100% - 110px)'}}
                        placeholder="请输入数值"
                        onChange={(e) => {
                            const value = e.target.value
                            setAmount(value.replaceAll(",", ""))
                        }}
                    />
                </Form.Item>
                <Form.Item className={'converter'} noStyle>
                    <InputNumber
                        value={digits}
                        min={0}
                        max={18}
                        style={{width: '110px'}}
                        addonAfter="位"
                        onChange={(e) => {
                            setDigits(e)
                        }}
                    />
                </Form.Item>
            </Space.Compact>
        </Form.Item>

        <Form.Item>
            <Space.Compact block>
                <Input
                    disabled
                    value={bnb}
                    style={{width: 'calc(100% - 32px)'}}
                    placeholder="请输入数值"
                />
                <Paragraph
                    style={{display: 'inline-block', width: "32px", marginBottom: 0}}
                    copyable={{
                        tooltips: false,
                        text: bnb,
                        icon: [<Button icon={<SnippetsOutlined/>}/>, <Button icon={<CheckOutlined/>}/>]
                    }}/>
            </Space.Compact>
        </Form.Item>

        <Form.Item>
            <Space.Compact block>
                <Input
                    disabled
                    value={wei}
                    style={{width: 'calc(100% - 32px)'}}
                    placeholder="请输入数值"/>
                <Paragraph
                    style={{display: 'inline-block', width: "32px", marginBottom: 0}}
                    copyable={{
                        tooltips: false,
                        text: wei,
                        icon: [<Button icon={<SnippetsOutlined/>}/>, <Button icon={<CheckOutlined/>}/>]
                    }}/>
            </Space.Compact>
        </Form.Item>
    </>
}

export default Unit
