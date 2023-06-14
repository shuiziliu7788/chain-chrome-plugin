import {Popover, Table, Tooltip} from "antd";
import React from "react";
import {EyeOutlined, InfoCircleOutlined} from "@ant-design/icons";
import type {ColumnsType} from "antd/es/table";
import {Swap} from "./utils";
import FeePopover from "@/components/test/swap/FeePopover";
import {FeeCell, GasCell} from "./FeeCell";


const FeeView = ({dataSource}: { dataSource: Swap[] }) => {

    const columns: ColumnsType<Swap> = [
        {
            title: '#',
            key: 'id',
            dataIndex: 'id',
            align: 'center',
            render: (value, record) => <>
                {
                    !record.error && <Popover
                        destroyTooltipOnHide={true}
                        placement={'leftBottom'}
                        title={<FeePopover record={record}/>}
                    >
                        <EyeOutlined
                            style={{marginRight: 3, cursor: 'pointer'}}
                        />
                    </Popover>
                }
                {record.href ? <a target={'_blank'} href={record.href}>{value ?? "--"}</a> : (value ?? "--")}
            </>
        },
        {
            title: '买',
            key: 'buy',
            align: 'center',
            children: [
                {
                    title: "FEE",
                    key: 'buy_fee',
                    align: 'center',
                    dataIndex: ['buy', 'fee'],
                    ellipsis: true,
                    onCell: (fee,) => ({
                        colSpan: fee.error ? 6 : (fee.buy.state == 1 ? 1 : 2),
                    }),
                    render: (value: bigint, record) => {
                        if (record.error) {
                            return <Tooltip title={record.error}>
                                <InfoCircleOutlined
                                    style={{
                                        color: '#ff4d4f',
                                        cursor: 'pointer'
                                    }}
                                />
                            </Tooltip>
                        }
                        return <FeeCell info={record.buy} isBuy={true}/>
                    },
                },
                {
                    title: "GAS",
                    key: 'buy_gas',
                    align: 'center',
                    dataIndex: ['buy', 'gas'],
                    onCell: (fee,) => ({
                        colSpan: fee.error ? 0 : (fee.buy.state == 1 ? 1 : 0)
                    }),
                    render: (value: bigint) => <GasCell gas={value}/>
                },
            ],
        },
        {
            title: '卖',
            key: 'sell',
            align: 'center',
            children: [
                {
                    title: "FEE",
                    key: 'sell_fee',
                    align: 'center',
                    dataIndex: ['sell', 'fee'],
                    onCell: (fee,) => ({
                        colSpan: fee.error ? 0 : fee.sell.state == 1 ? 1 : 2
                    }),
                    render: (value, record) => <FeeCell info={record.sell} />,
                },
                {
                    title: "GAS",
                    key: 'sell_gas',
                    align: 'center',
                    dataIndex: ['sell', 'gas'],
                    onCell: (fee,) => ({
                        colSpan: fee.error ? 0 : fee.sell.state == 1 ? 1 : 0
                    }),
                    render: (value: bigint) => <GasCell gas={value}/>
                },
            ],
        },
        {
            title: '转',
            key: 'transfer',
            align: 'center',
            children: [
                {
                    title: "FEE",
                    key: 'transfer_fee',
                    align: 'center',
                    dataIndex: ['transfer', 'fee'],
                    onCell: (fee,) => ({
                        colSpan: fee.error ? 0 : fee.transfer.state == 1 ? 1 : 2
                    }),
                    render: (value, record) => <FeeCell info={record.transfer}/>,
                },
                {
                    title: "GAS",
                    key: 'transfer_gas',
                    align: 'center',
                    dataIndex: ['transfer', 'gas'],
                    onCell: (fee,) => ({
                        colSpan: fee.error ? 0 : fee.transfer.state == 1 ? 1 : 0
                    }),
                    render: (value: bigint) => <GasCell gas={value}/>
                },
            ],
        },
    ]

    return <Table
        bordered={true}
        showHeader={true}
        size={'small'}
        pagination={false}
        dataSource={dataSource}
        rowKey={'key'}
        scroll={{y: 320}}
        columns={columns}
    />
}

export default FeeView