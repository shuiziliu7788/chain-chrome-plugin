import {Button, Card, Form, Input, InputNumber, Space} from "antd";
import SelectRouter from "@/components/test/swap/SelectRouter";
import React, {useContext, useEffect, useState} from "react";
import SelectToken from "@/components/test/swap/SelectToken";
import {SwapOutlined} from "@ant-design/icons";
import {ConsumerProps, ExplorerContext} from "@/components";
import SelectAccount from "@/components/test/swap/SelectAccount";
import {concat, formatUnits, getUint, toBeHex, zeroPadValue} from "ethers";
import {call} from "@/utils/eth";

const Liquidity = () => {
    const [form] = Form.useForm()
    const tokenInSymbol = Form.useWatch(['tokenIn', 'symbol'], form)
    const tokenOutSymbol = Form.useWatch(['tokenOut', 'symbol'], form)
    const account = Form.useWatch('account', form)
    const tokenOutAddress = Form.useWatch(['tokenOut', 'address'], form)
    const [max, setMax] = useState<bigint>(0n)
    const [accounts, setAccounts] = useState<any[]>([]);
    const {contract, submitSimulation, explorer} = useContext<ConsumerProps>(ExplorerContext);

    const onFinish = async (values) => {

    }

    useEffect(() => {
        const tokenOut = contract.symbol ? {
            address: contract.address,
            symbol: contract.symbol,
            decimals: contract.decimals
        } : undefined
        const tokenIn = explorer.tokens.length > 0 ? explorer.tokens[0] : undefined
        let router = explorer.router.find(router => router.address == contract.router);
        router = router ? router : explorer.router.length > 0 ? explorer.router[0] : {
            address: contract.router,
        }
        form.setFieldsValue({
            router: router,
            tokenOut,
            tokenIn,
        })
        if (contract.owner) {
            setAccounts([
                {
                    label: "创建者",
                    value: contract.owner,
                }
            ])
        }
    }, [])

    useEffect(() => {
        if (!account || !tokenOutAddress) {
            return
        }
        call(explorer.rpc, {
            to: tokenOutAddress,
            data: concat(["0x70a08231", zeroPadValue(toBeHex(account), 32)]),
        }).then(resp => {
            console.log(getUint(resp))
            setMax(getUint(resp))
        })

    }, [account, tokenOutAddress])


    return <Card className={'tool-card'}>
        <Form
            form={form}
            autoComplete="off"
            layout={'vertical'}
            onFinish={onFinish}
            initialValues={{}}
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
                    <Button disabled className={'w80'}>{tokenInSymbol ?? '未选择'}</Button>
                    <Form.Item
                        rules={[{required: true, message: `请输入${tokenInSymbol}数量`}]}
                        name={'amountIn'}
                        noStyle
                    >
                        <InputNumber
                            style={{width: '100%'}}
                            placeholder={`请输入${tokenInSymbol}数量,自动兑换`}
                        />
                    </Form.Item>
                </Space.Compact>
            </Form.Item>

            <Form.Item>
                <Space.Compact block>
                    <Button disabled className={'w80'}>{tokenOutSymbol ?? '未选择'}</Button>
                    <Form.Item
                        rules={[{required: true, message: `请输入${tokenOutSymbol}数量`}]}
                        name={'amountOut'}
                        noStyle
                    >
                        <Input
                            style={{width: '100%'}}
                            placeholder={`请输入${tokenOutSymbol}数量`}
                            suffix={<a
                                onClick={() => {
                                    const decimals = form.getFieldValue(['tokenOut', 'decimals']);
                                    form.setFieldValue("amountOut", formatUnits(max, decimals ?? 18))
                                }}
                            >
                                最大
                            </a>}
                        />
                    </Form.Item>
                </Space.Compact>
            </Form.Item>

            <Form.Item>
                <Button htmlType={'submit'} type={'primary'} block>添加池子</Button>
            </Form.Item>
        </Form>
    </Card>
}

export default Liquidity