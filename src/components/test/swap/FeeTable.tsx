import {ConfigProvider, Table} from "antd";
import React from "react";
import type {ColumnsType} from "antd/es/table";
import FeePopover from "./FeePopover";
import {ErrorCell, FeeCell, GasCell} from "./FeeCell";
import type {TradeColumn} from "@/components/test/swap/typing";
import {TradeInfo} from "@/components/test/swap/typing";

interface FeeTableProps {
    dataSource: TradeColumn[]
}


const FeeTable = ({dataSource}: FeeTableProps) => {

    const columns: ColumnsType<TradeColumn> = [
        {
            title: '#',
            key: 'id',
            dataIndex: 'id',
            align: 'center',
            render: (_, record) => record.id == undefined ? '--' : <FeePopover record={record}/>
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
                    dataIndex: ['buy'],
                    ellipsis: true,
                    onCell: (data) => ({
                        colSpan: data.error ? 6 : (data.buy.state == 1n ? 1 : 2),
                    }),
                    render: (value: TradeInfo, record) => record.error ?
                        <ErrorCell record={record}/> :
                        <FeeCell
                            trade={value}
                            type={'buy'}
                        />
                },
                {
                    title: "GAS",
                    key: 'buy_gas',
                    align: 'center',
                    dataIndex: ['buy', 'gas'],
                    onCell: (fee,) => ({
                        colSpan: fee.error ? 0 : (fee.buy.state == 1n ? 1 : 0)
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
                    dataIndex: ['sell'],
                    onCell: (fee,) => ({
                        colSpan: fee.error ? 0 : fee.sell.state == 1n ? 1 : 2
                    }),
                    render: (value) => <FeeCell
                        trade={value}
                        type={'sell'}
                    />
                },
                {
                    title: "GAS",
                    key: 'sell_gas',
                    align: 'center',
                    dataIndex: ['sell', 'gas'],
                    onCell: (fee,) => ({
                        colSpan: fee.error ? 0 : fee.sell.state == 1n ? 1 : 0
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
                    dataIndex: 'transfer',
                    onCell: (fee,) => ({
                        colSpan: fee.error ? 0 : fee.transfer.state == 1n ? 1 : 2
                    }),
                    render: (value) => <FeeCell
                        trade={value}
                        type={'transfer'}
                    />,
                },
                {
                    title: "GAS",
                    key: 'transfer_gas',
                    align: 'center',
                    dataIndex: ['transfer', 'gas'],
                    onCell: (fee,) => ({
                        colSpan: fee.error ? 0 : fee.transfer.state == 1n ? 1 : 0
                    }),
                    render: (value: bigint) => <GasCell gas={value}/>
                },
            ],
        },
    ]

    return (<ConfigProvider
        theme={{
            token: {
                fontSize: 13,
                sizeStep: 3,
            },
        }}
    >
        <Table
            bordered={true}
            showHeader={true}
            size={'small'}
            pagination={false}
            dataSource={dataSource}
            rowKey={'key'}
            scroll={{y: 320}}
            columns={columns}
        />
    </ConfigProvider>)
}


export default FeeTable