import {AutoComplete, Button, Col, Form, Input, Row, Space, Tooltip} from "antd";
import {DownOutlined} from "@ant-design/icons";
import React, {useState} from "react";


interface SelectAccountProps {
    accounts:{
        disabled?: boolean;
        [name: string]: any;
    }[]
}

const SelectAccount = ({accounts}:SelectAccountProps) => {
    const [more, setMore] = useState(false)

    return <>
        <Form.Item>
            <Space.Compact className={'aflex'} block>
                <Input
                    disabled
                    value={'钱包'}
                />
                <Form.Item name='account' noStyle>
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
                                label: '账号',
                                options: accounts,
                            },
                        ]}
                    />
                </Form.Item>
                <Tooltip title={'更多参数'}>
                    <Button
                        onClick={() => {
                            setMore(!more)
                        }}
                        icon={<DownOutlined/>}/>
                </Tooltip>
            </Space.Compact>
        </Form.Item>

        <Row style={{display: more ? 'flex' : 'none'}} gutter={16}>
            <Col span={12}>
                <Form.Item name={'gasPrice'}>
                    <Input
                        suffix={'Gwei'}
                        placeholder="燃料单价"
                        allowClear
                        addonBefore={'GasPrice'}
                    />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item name={'gas'}>
                    <Input
                        suffix={'万'}
                        placeholder="燃料上限"
                        allowClear
                        addonBefore={'GAS'}/>
                </Form.Item>
            </Col>
        </Row>
    </>
}

export default SelectAccount