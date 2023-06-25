import {AutoComplete, Button, Card, Col, Form, InputNumber, Row, Space} from "antd";
import React, {useContext, useEffect, useState} from "react";
import {ConsumerProps, ExplorerContext, unique} from "@/components";
import SelectToken from "./SelectToken";
import {SwapOutlined} from "@ant-design/icons";
import SelectAccount from "./SelectAccount";
import SelectRouter from "./SelectRouter";
import FeeTable from "./FeeTable";
import {decode, encode, TestAddress} from "./utils";
import type {CallForm, TradeColumn} from "./typing";

const Swap = () => {
    const {contract, submitSimulation,} = useContext<ConsumerProps>(ExplorerContext);
    const [fee, setFee] = useState<TradeColumn[]>([])
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([
        {
            label: '测试合约',
            value: '0xBd770416a3345F91E4B34576cb804a576fa48EB1',
        }
    ]);

    const onFinish = async (values: CallForm) => {
        setLoading(true)

        for (let i = 0; i < values.quantity ?? 1; i++) {
            const swaps: TradeColumn[] = [];
            try {
                const resp = await submitSimulation({
                    from: values.account,
                    gas: values.gas,
                    to: TestAddress,
                    gas_price: values.gasPrice,
                    input: encode(values),
                    save: true,
                    value: "0",
                })

                swaps.push(...decode(resp, values))

                setAccounts((prevState: any[]) => {
                    const accounts = swaps.filter(swap => !!swap.account).map(swap => ({
                        label: `${swap.account.account == TestAddress ? '测试合约' : `${swap.id}账户`}：${swap.account.balanceOut}${values.tokenOut.symbol}`,
                        value: swap.account.account,
                    }))
                    return unique([
                        ...accounts,
                        ...prevState
                    ], 'value')
                })

            } catch (e) {
                swaps.push({
                    key: `${Math.random()}`,
                    error: e.toString(),
                })
            }

            console.log(swaps)

            setFee((fees) => {
                return [
                    ...swaps,
                    ...fees
                ]
            })
        }

        setLoading(false)
    }

    const onReset = () => {
        form.setFieldsValue({
            quantity: 1,
            count: 1,
        })
    }

    useEffect(() => {
        form.setFieldsValue({
            router: contract.router,
            account: "0xBd770416a3345F91E4B34576cb804a576fa48EB1",
            recipient: TestAddress,
            tokenOut: contract.token,
            tokenIn: contract.pool,
        })
    }, [])

    return <Card className={'tool-card'}>
        <Form
            form={form}
            autoComplete="off"
            layout={'vertical'}
            onFinish={onFinish}
            initialValues={{
                amountBuy: 0.05,
                amountSell: 80,
                amountTransfer: 100,
                count: 1,
                quantity: 1,
                gas: 1000,
            }}
            scrollToFirstError={true}
        >
            <Form.Item
                rules={[{required: true, message: "请输入交易路由"}]}
                name='router'
            >
                <SelectRouter/>
            </Form.Item>

            <SelectAccount
                accounts={accounts}
                onChange={(value) => {
                    form.setFieldsValue({
                        quantity: 1,
                        count: 1,
                        recipient: value,
                    })
                }}
            />

            <Form.Item>
                <Space.Compact block>
                    <Form.Item
                        rules={[{required: true, message: "请输入支付的代币"}]}
                        name={'tokenIn'}
                        noStyle>
                        <SelectToken
                            style={{maxWidth: 'calc(50% - 16px)'}}
                        />
                    </Form.Item>
                    <Button
                        icon={<SwapOutlined/>}
                        onClick={() => {
                            const {tokenIn, tokenOut} = form.getFieldsValue(['tokenIn', 'tokenOut']);
                            form.setFieldsValue({
                                tokenIn: tokenOut,
                                tokenOut: tokenIn,
                            })
                        }}
                    />
                    <Form.Item
                        rules={[{required: true, message: "请输入需要兑换的代币"}]}
                        name={'tokenOut'}
                        noStyle>
                        <SelectToken
                            style={{maxWidth: 'calc(50% - 16px)'}}
                        />
                    </Form.Item>
                </Space.Compact>
            </Form.Item>

            <Form.Item>
                <Space.Compact block>
                    <Form.Item
                        rules={[{required: true, message: '请输入买百分比'}]}
                        name={'amountBuy'}
                        noStyle
                    >
                        <InputNumber
                            precision={2}
                            controls={false}
                            placeholder={'0'}
                            min={0}
                            max={100}
                            addonBefore={'买'}
                            addonAfter={'%'}
                            onChange={onReset}
                        />
                    </Form.Item>
                    <Form.Item
                        rules={[{required: true, message: '请输入卖百分比'}]}
                        name={'amountSell'}
                        noStyle
                    >
                        <InputNumber
                            precision={2}
                            controls={false}
                            min={0}
                            max={100}
                            addonBefore={'卖'}
                            addonAfter={'%'}
                            onChange={onReset}
                        />
                    </Form.Item>

                    <Form.Item
                        rules={[{required: true, message: '请输入转百分比'}]}
                        name={'amountTransfer'}
                        noStyle
                    >
                        <InputNumber
                            precision={2}
                            controls={false}
                            min={0}
                            max={100}
                            addonBefore={'转'}
                            addonAfter={'%'}
                            onChange={onReset}
                        />
                    </Form.Item>
                </Space.Compact>
            </Form.Item>

            <Form.Item>
                <Space.Compact className={'flex'} block>
                    <Button disabled className={'w80'}>接受者</Button>
                    <Form.Item name={'recipient'} noStyle>
                        <AutoComplete
                            className={'full'}
                            allowClear
                            placeholder="请输入钱包"
                            options={[
                                {
                                    label: '测试合约',
                                    value: '0xBd770416a3345F91E4B34576cb804a576fa48EB1',
                                },
                                {
                                    label: '随机账号',
                                    value: '0x0000000000000000000000000000000000000001',
                                }
                            ]}
                            onChange={onReset}
                        />
                    </Form.Item>
                </Space.Compact>
            </Form.Item>

            <Form.Item>
                <Row gutter={[12, 12]}>
                    <Col span={15}>
                        <Space.Compact block>
                            <Form.Item name={'quantity'} noStyle>
                                <InputNumber
                                    style={{width: 230}}
                                    min={1}
                                    max={5}
                                    addonBefore={'购买'}
                                    addonAfter={'次，每'}

                                />
                            </Form.Item>
                            <Form.Item name={'count'} noStyle>
                                <InputNumber
                                    style={{width: 135}}
                                    min={1}
                                    max={10}
                                    addonAfter={'单'}
                                />
                            </Form.Item>
                        </Space.Compact>
                    </Col>

                    <Col span={9}>
                        <Button loading={loading} htmlType={'submit'} block type={'primary'}>交易</Button>
                    </Col>
                </Row>
            </Form.Item>

            <FeeTable
                dataSource={fee}
            />
        </Form>
    </Card>
}

export default Swap