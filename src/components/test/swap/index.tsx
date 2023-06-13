import {AutoComplete, Button, Card, Col, Form, Input, InputNumber, Row, Space, Tooltip} from "antd";
import React, {useContext, useEffect, useState} from "react";
import {ConsumerProps, ExplorerContext} from "@/components";
import SelectToken from "./SelectToken";
import {SwapOutlined} from "@ant-design/icons";
import SelectAccount from "./SelectAccount";
import SelectRouter from "./SelectRouter";
import FeeView from "./FeeView";
import {decode, encode, Swap, TestAddress} from "./utils";

const Swap = () => {
    const {
        contract,
        submitSimulation,
        tenderly_account,
        explorer
    } = useContext<ConsumerProps>(ExplorerContext);

    const [fee, setFee] = useState<Swap[]>([])
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([
        {
            label: '测试合约',
            value: '0xBd770416a3345F91E4B34576cb804a576fa48EB1',
        }
    ]);

    const onFinish = async (values) => {
        setLoading(true)
        const swaps: Swap[] = new Array(0);
        try {
            const resp = await submitSimulation({
                from: values.account,
                gas_limit: values.gas,
                to: TestAddress,
                gas_price: values.gasPrice,
                input: encode(values),
                save: true,
                value: "0",
            })

            if (resp.transaction.error_message) {
                swaps.push({
                    simulation: {
                        fork_id: resp.simulation.fork_id,
                        id: resp.simulation.id,
                    },
                    key: `${Math.random()}`,
                    error: `${resp.transaction.error_info.error_message} form ${resp.transaction.error_info.address}`,
                })
                return
            }

            swaps.push(...decode(resp, values))

            setAccounts((prevState: any[]) => {
                prevState = [
                    ...swaps.map(swap => ({
                        label: `${swap.recipient == TestAddress ? '测试合约' : `${swap.id}账户`}：${swap.tokenOut.amount}${swap.tokenOut.symbol}`,
                        value: swap.recipient,
                    })),
                    ...prevState
                ]
                const map = new Map()
                return prevState.filter((item) => !map.has(item['value']) && map.set(item['value'],true))
            })

        } catch (e) {
            console.log(e)
            swaps.push({
                key: `${Math.random()}`,
                error: e.toString(),
            })
        } finally {
            setLoading(false)
        }

        setFee([
            ...swaps,
            ...fee
        ])
    }

    useEffect(() => {
        const tokenOut = contract.symbol ? {
            address: contract.address,
            symbol: contract.symbol,
            decimals: contract.decimals
        } : {}

        const tokenIn = explorer.tokens.length > 0 ? explorer.tokens[0] : {}
        let router = explorer.router.find(router => router.address == contract.router);

        router = router ? router : explorer.router.length > 0 ? explorer.router[0] : {
            address: contract.router,
        }

        form.setFieldsValue({
            router: router,
            account: "0xBd770416a3345F91E4B34576cb804a576fa48EB1",
            recipient: TestAddress,
            tokenOut,
            tokenIn,
        })

    }, [])

    return <Card className={'tool-card'}>
        <Form
            form={form}
            autoComplete="off"
            layout={'vertical'}
            onFinish={onFinish}
            initialValues={{
                amountBuy: 0.1,
                amountSell: 60,
                amountTransfer: 40,
                count: 1,
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
                onSelect={(value) => {
                    form.setFieldValue("recipient", value)
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
                            addonAfter={<Tooltip title={'池子百分比'}>%</Tooltip>}
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
                            placeholder={'0'}
                            min={0}
                            max={100}
                            addonBefore={'卖'}
                            addonAfter={<Tooltip title={'余额百分比'}>%</Tooltip>}
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
                            placeholder={'0'}
                            min={0}
                            max={100}
                            addonBefore={'转'}
                            addonAfter={<Tooltip title={'余额百分比'}>%</Tooltip>}
                        />
                    </Form.Item>
                </Space.Compact>
            </Form.Item>

            <Form.Item>
                <Space.Compact className={'aflex'} block>
                    <Input
                        disabled
                        value={'接受'}
                    />
                    <Form.Item name={'recipient'} noStyle>
                        <AutoComplete
                            className={'full'}
                            allowClear
                            placeholder="请输入钱包"
                            options={[
                                {
                                    label: '测试合约',
                                    value: '0xbd770416a3345f91e4b34576cb804a576fa48eb1',
                                },
                                {
                                    label: '随机账号',
                                    value: '0x0000000000000000000000000000000000000001',
                                }
                            ]}
                        />
                    </Form.Item>
                </Space.Compact>
            </Form.Item>

            <Row gutter={[12, 12]}>
                <Col span={12}>
                    <Form.Item name={'count'}>
                        <InputNumber
                            min={1}
                            max={30}
                            addonBefore={'次数'}
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Button loading={loading} htmlType={'submit'} block type={'primary'}>交易</Button>
                </Col>
            </Row>
            <FeeView
                dataSource={fee}
            />
        </Form>
    </Card>
}

export default Swap