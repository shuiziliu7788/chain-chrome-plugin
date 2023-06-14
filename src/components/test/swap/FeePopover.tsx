import {Descriptions, Divider, Space} from "antd";
import {RightCircleOutlined} from "@ant-design/icons";
import React, {CSSProperties} from "react";
import type {Swap} from "./utils";

interface FeePopoverProps {
    record: Swap
}

const symbolStyles: CSSProperties = {
    color: '#1677ff',
}

const FeePopover = ({record}: FeePopoverProps) => {

    return <Descriptions
        title="交易信息"
        layout="vertical"
        size={'small'}
        style={{width: 260}}
        contentStyle={{display: "block"}}
    >
        <Descriptions.Item
            span={3}
            label="区块"
        >
            {record.block_number}（{record.time}）
        </Descriptions.Item>

        {
            record.buy.state == 1 && <Descriptions.Item
                span={3}
                label="买"
            >
                <Space size={'small'} wrap>
                    <span>{record.buy.tokenIn.amount}</span>
                    <span style={symbolStyles}>
                      {record.buy.tokenIn.symbol}
                    </span>
                    <RightCircleOutlined/>
                    <span>{record.buy.tokenOut.amount}</span>
                    <span style={symbolStyles}>
                        {record.buy.tokenOut.symbol}
                    </span>
                </Space>
            </Descriptions.Item>
        }

        {
            record.sell.state == 1 && <Descriptions.Item
                span={3}
                label="卖"
            >
                <Space size={'small'} wrap>
                    <span>{record.sell.tokenIn.amount}</span>
                    <span style={symbolStyles}>
                         {record.sell.tokenIn.symbol}
                     </span>
                    <RightCircleOutlined/>
                    <span>{record.sell.tokenOut.amount}</span>
                    <span style={symbolStyles}>
                        {record.sell.tokenOut.symbol}
                     </span>
                </Space>
            </Descriptions.Item>
        }

        {
            record.transfer.state == 1 && <Descriptions.Item
                span={3}
                label="转"
            >
                <Space size={'small'} wrap>
                    <span>{record.transfer.tokenIn.amount}</span>
                    <span style={symbolStyles}>
                        {record.transfer.tokenIn.symbol}
                    </span>
                    <RightCircleOutlined/>
                    <span>{record.transfer.tokenOut.amount}</span>
                    <span style={symbolStyles}>
                        {record.transfer.tokenOut.symbol}
                    </span>
                </Space>

            </Descriptions.Item>
        }

        {
            record.tokenIn && record.tokenOut && <>
                <Descriptions.Item
                    span={3}
                    label={`余额（${record.recipient.slice(0, 4)}***${record.recipient.slice(-6)}）`}
                >
                    <Space size={'small'} direction={'vertical'}>
                        <Space size={'small'} wrap>
                            <span>{record.tokenIn.amount}</span>
                            <span style={symbolStyles}>
                            {record.tokenIn.symbol}
                         </span>
                        </Space>
                        <Space size={'small'} wrap>
                            <span>{record.tokenOut.amount}</span>
                            <span style={symbolStyles}>
                            {record.tokenOut.symbol}
                        </span>
                        </Space>
                    </Space>
                </Descriptions.Item>
                {
                    (record.tokenOut.isSwap || record.tokenOut.isAddPair || record.tokenOut.isReserve) &&
                    <Descriptions.Item span={3} label={'备注'}>
                        <Space size={[0, 12]} split={<Divider type="vertical"/>} wrap>
                            {
                                record.tokenOut.isSwap && <span>自动出货</span>
                            }
                            {
                                record.tokenOut.isAddPair && <span>自动添加池子</span>
                            }
                            {
                                record.tokenOut.isReserve && <span>自动保留</span>
                            }
                        </Space>

                    </Descriptions.Item>
                }
            </>
        }
    </Descriptions>
}

export default FeePopover