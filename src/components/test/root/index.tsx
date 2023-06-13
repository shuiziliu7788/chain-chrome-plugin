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

}

const Root = (props: RootProps) => {
    const {contract} = React.useContext<ConsumerProps>(ExplorerContext);
    const [more, setMore] = useState(false)

    return <>
        <Form.Item>
            <Space.Compact className={'aflex'} block>
                <Input disabled value={'TO'}/>
                <Form.Item name='to' noStyle>
                    <AutoComplete
                        className={'full'}
                        allowClear
                        placeholder="请输入TO地址"
                        options={props.to_suggestion_address ?? contract.suggestion_address}
                    />
                </Form.Item>
            </Space.Compact>
        </Form.Item>

        <Form.Item>
            <Space.Compact className={'aflex'} block>
                <Input
                    disabled
                    value={'FROM'}
                />
                <Form.Item name='from' noStyle>
                    <AutoComplete
                        className={'full'}
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
                        placeholder="0.1 ether"
                        allowClear
                        addonBefore={'VALUE'}
                    />
                </Form.Item>
            </Col>
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

export default Root