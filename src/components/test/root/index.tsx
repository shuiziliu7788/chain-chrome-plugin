import {AutoComplete, Button, Col, Form, Input, Row, Space, Tooltip} from "antd";
import {DownOutlined} from "@ant-design/icons";
import React, {useState} from "react";
import {ConsumerProps, ExplorerContext} from "@/components/provider";

interface RootProps {
    from_suggestion_address?: {
        label: string
        value: string
    }[]
    to_suggestion_address?: {
        label: string
        value: string
    }[]
    rewriteHeader?: boolean
}

const Root = (props: RootProps) => {
    const {contract} = React.useContext<ConsumerProps>(ExplorerContext);
    const [more, setMore] = useState(false)

    return <>
        <Form.Item>
            <Space.Compact className={'flex'} block>
                <Button className={'w80'} disabled>合约</Button>
                <Form.Item name='to' noStyle>
                    <AutoComplete
                        className={'auto'}
                        allowClear
                        placeholder="请输入TO地址"
                        options={props.to_suggestion_address ?? contract.suggestion_address}
                    />
                </Form.Item>
            </Space.Compact>
        </Form.Item>

        <Form.Item>
            <Space.Compact className={'flex'} block>
                <Button className={'w80'} disabled>调用者</Button>
                <Form.Item name='from' noStyle>
                    <AutoComplete
                        className={'auto'}
                        allowClear
                        placeholder="请输入FROM地址"
                        options={props.from_suggestion_address ?? contract.suggestion_address}
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
            <Col span={24}>
                <Form.Item name={'value'}>
                    <Input
                        className={'addon'}
                        placeholder="0.1 ether"
                        allowClear
                        addonBefore={'value'}
                    />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item name={'gasPrice'}>
                    <Input
                        className={'addon'}
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
                        className={'addon'}
                        suffix={'万'}
                        placeholder="燃料上限"
                        allowClear
                        addonBefore={'GAS'}/>
                </Form.Item>
            </Col>
            {
                props.rewriteHeader && <>
                    <Col span={12}>
                        <Form.Item name={['block_header', 'number']}>
                            <Input
                                className={'addon'}
                                placeholder="区块"
                                allowClear
                                addonBefore={'区块'}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name={['block_header', 'timestamp']}>
                            <Input
                                className={'addon'}
                                placeholder="时间戳"
                                allowClear
                                addonBefore={'时间戳'}/>
                        </Form.Item>
                    </Col>
                </>
            }
        </Row>
    </>
}

export default Root