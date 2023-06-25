import {App, Button, Card, Form, Input, Space} from "antd";
import SelectRouter from "@/components/test/swap/SelectRouter";
import React, {useContext, useEffect, useState} from "react";
import SelectToken from "@/components/test/swap/SelectToken";
import {SwapOutlined} from "@ant-design/icons";
import {ConsumerProps, ExplorerContext} from "@/components";
import SelectAccount from "@/components/test/swap/SelectAccount";
import {concat, formatUnits, getUint, parseUnits, toBeHex, zeroPadValue} from "ethers";
import {call} from "@/utils/eth";
import {TestAddress} from "./utils";
import {TestSwapIface} from "@/constant";
import HashValue from "@/components/value";
import {ParamType} from "@/utils/function";
import {FormatNumber} from "@/utils/number";

const Liquidity = () => {
    const {message} = App.useApp();
    const [form] = Form.useForm()
    const tokenInSymbol = Form.useWatch(['tokenIn', 'symbol'], form)
    const tokenOutSymbol = Form.useWatch(['tokenOut', 'symbol'], form)
    const tokenOutAddress = Form.useWatch(['tokenOut', 'address'], form)
    const tokenOutDecimals = Form.useWatch<number>(['tokenOut', 'decimals'], form)
    const account = Form.useWatch('account', form)

    const [max, setMax] = useState<bigint>(0n)
    const [loading, setLoading] = useState<boolean>(false)
    const [err, setErr] = useState<string>()
    const [outputs, setOutputs] = useState<ParamType[]>([])
    const [accounts, setAccounts] = useState<any[]>([]);
    const {contract, submitSimulation, explorer} = useContext<ConsumerProps>(ExplorerContext);

    const onFinish = async (values) => {
        setLoading(true)
        setOutputs([])
        setErr("")
        try {
            values.amountIn = parseUnits(values.amountIn, values.tokenIn.decimals)
            values.amountOut = parseUnits(values.amountOut, values.tokenOut.decimals)
            // 第一步授权tokenOut
            await submitSimulation({
                from: values.account,
                gas: values.gas,
                to: values.tokenOut.address,
                gas_price: values.gasPrice,
                input: concat([
                    "0x095ea7b3",
                    zeroPadValue(TestAddress, 32),
                    zeroPadValue(toBeHex(values.amountOut), 32),
                ]),
                save: true,
            })

            // 第二部 添加池子
            const addLiquidityV2 = await submitSimulation({
                from: values.account,
                gas: values.gas,
                to: TestAddress,
                gas_price: values.gasPrice,
                input: TestSwapIface.encodeFunctionData("addLiquidityV2", [{
                    router: values.router.address,
                    tokenIn: values.tokenIn.address,
                    tokenOut: values.tokenOut.address,
                    amountIn: values.amountIn,
                    amountOut: values.amountOut,
                }]),
                save: true,
            })

            if (addLiquidityV2.transaction.error_message) {
                message.error(addLiquidityV2.transaction.error_message)
                return
            }

            const result = TestSwapIface.decodeFunctionResult("addLiquidityV2", addLiquidityV2.transaction.transaction_info.call_trace.output);

            const outputs = TestSwapIface.getFunction('addLiquidityV2').outputs;

            setOutputs((): ParamType[] => {
                return outputs.map((output): ParamType => {
                    return {
                        name: output.name,
                        baseType: output.baseType,
                        type: output.type,
                        fixed: true,
                        value: result.getValue(output.name),
                    }
                })
            })
        } catch (e) {
            setErr(e.toString())
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        form.setFieldsValue({
            account: contract.creator,
            router: contract.router,
            tokenOut: contract.token,
            tokenIn: contract.pool,
        })
        let accounts: any[] = []
        if (contract.creator) {
            accounts.push({
                label: "创建者",
                value: contract.creator,
            })
        }
        if (contract.creator != contract.owner) {
            accounts.push({
                label: "管路员",
                value: contract.owner,
            })
        }
        setAccounts(accounts)
    }, [])

    useEffect(() => {
        if (!account || !tokenOutAddress) {
            return
        }
        call(explorer.rpc, {
            to: tokenOutAddress,
            data: concat(["0x70a08231", zeroPadValue(toBeHex(account), 32)]),
        }).then(resp => {
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
                onChange={(value) => {
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


            <Form.Item
                className={'token-label'}
                rules={[{required: true, message: `请输入${tokenInSymbol ?? ''}数量`}]}
                name={'amountIn'}
                label={<>
                    <div>{tokenInSymbol ?? '未选择'}</div>
                    <div>合约自动兑换</div>
                </>}
            >
                <Input
                    style={{width: '100%'}}
                    placeholder={`请输入${tokenOutSymbol ?? ''}数量`}

                />
            </Form.Item>

            <Form.Item
                className={'token-label'}
                rules={[{required: true, message: `请输入${tokenOutSymbol ?? ''}数量`}]}
                name={'amountOut'}
                label={<>
                    <div>{tokenOutSymbol ?? '未选择'}</div>
                    <div>余额：{`${FormatNumber(max, tokenOutDecimals ?? 18)}`}</div>
                </>}
            >
                <Input
                    style={{width: '100%'}}
                    placeholder={`请输入${tokenOutSymbol ?? ''}数量`}
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

            <Form.Item>
                <Button loading={loading} htmlType={'submit'} type={'primary'} block>
                    添加池子
                </Button>
            </Form.Item>
            {
                err && <Form.Item validateStatus={'error'}>
                    <Input disabled style={{color: '#dc4446'}} value={err}/>
                </Form.Item>
            }
            {
                outputs.map((value, index) => <HashValue index={index} key={index} value={value}/>)
            }
        </Form>
    </Card>
}

export default Liquidity