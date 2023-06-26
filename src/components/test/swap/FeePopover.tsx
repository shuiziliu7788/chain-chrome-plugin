import {ConfigProvider, Divider, Popover, Space, Tabs} from "antd";
import React, {ReactNode, useContext} from "react";
import type {Event, TradeColumn, TradeInfo} from "./typing";
import {EyeOutlined} from "@ant-design/icons";
import type {Token} from "@/components";
import {ConsumerProps, ExplorerContext} from "@/components";
import {FormatNumber} from "@/utils/number";

interface FeePopoverProps {
    record: TradeColumn
}


interface LogProps {
    event: Event
}

const Log = ({event}: LogProps) => {
    return <div className='token'>
        <div className={'amount'}>
            {FormatNumber(event.amount, event.decimals)}
            <span className={'unit'}>
                {event.symbol}
            </span>
        </div>
        <div className={'path'}>
            <div className={'account'}>
                <div className={'direction'}>发</div>
                <div className={'address'}>
                    {event.formTag ? event.formTag : event.form}
                </div>
            </div>
            <div className={'account'}>
                <div className={'direction'}>收</div>
                <div className={'address'}>
                    {event.toTag ? event.toTag : event.to}
                </div>
            </div>
        </div>
    </div>
}

interface TradeProps {
    title?: string
    trade: TradeInfo,
    tokenIn?: Token,
    tokenOut?: Token,
}

const Logs = ({trade}: TradeProps) => {
    return <div className={'trade'}>
        <div className={'events'}>
            {
                trade.logs.map((log, index) => <Log key={index} event={log}/>)
            }
        </div>
    </div>
}

const Trade = ({trade, tokenIn, tokenOut, title}: TradeProps) => {

    const Tags = () => {
        const tags: ReactNode[] = []

        if (trade.tokenIn.isSwap || trade.tokenOut.isSwap) {
            tags.push(<span key={'is_swap'}>自动出货</span>)
        }

        if (trade.tokenIn.isAddPair || trade.tokenOut.isAddPair) {
            tags.push(<span key={'is_add_pair'}>添加池子</span>)
        }

        if (trade.tokenIn.reserveAmount > 0n || trade.tokenOut.reserveAmount > 0n) {
            tags.push(<span key={'reserve_amount'}>自动保留</span>)
        }

        if (trade.tokenIn.isBurn || trade.tokenOut.isBurn) {
            tags.push(<span key={'is_burn'}>自动燃烧</span>)
        }

        if (tags.length > 0) {
            return <Space wrap>
                {tags}
            </Space>
        }
        return null
    }

    return <div className={'trade'}>
        <div className={'header'}>
            <div className={'title'}>
                {title}
            </div>
            <div className={'fees'}>
                {
                    trade.tokenIn.fee > 0n && <>
                        {tokenIn.symbol}:{(Number(trade.tokenIn.fee) / 100).toFixed(2)}%
                    </>
                }
                {
                    tokenOut && trade.tokenOut.fee > 0n && <>
                        {tokenOut.symbol}:{(Number(trade.tokenOut.fee) / 100).toFixed(2)}%
                    </>
                }
            </div>
        </div>

        <div className='token'>
            <div className={'amount'}>
                {FormatNumber(trade.tokenIn.tradeAmount, tokenIn.decimals)}
                <span className={'unit'}>
                {tokenIn.symbol}
                </span>
            </div>
            <div className={'path'}>
                <div className={'account'}>
                    <div className={'direction'}>发</div>
                    <div className={'address'}>
                        {trade.tokenIn.formTag ? trade.tokenIn.formTag : trade.tokenIn.formAddress}
                    </div>
                </div>
                <div className={'account'}>
                    <div className={'direction'}>收</div>
                    <div className={'address'}>
                        {trade.tokenIn.recipientTag ? trade.tokenIn.recipientTag : trade.tokenIn.recipientAddress}
                    </div>
                </div>
            </div>
        </div>

        {
            tokenOut && <div className='token'>
                <div className={'amount'}>
                    {FormatNumber(trade.tokenOut.tradeAmount, tokenOut.decimals)}
                    <span className={'unit'}>
                        {tokenOut.symbol}
                    </span>
                </div>
                <div className={'path'}>
                    <div className={'account'}>
                        <div className={'direction'}>发</div>
                        <div className={'address'}>
                            {trade.tokenOut.formTag ? trade.tokenOut.formTag : trade.tokenOut.formAddress}
                        </div>
                    </div>
                    <div className={'account'}>
                        <div className={'direction'}>收</div>
                        <div className={'address'}>
                            {trade.tokenOut.recipientTag ? trade.tokenOut.recipientTag : trade.tokenOut.recipientAddress}
                        </div>
                    </div>
                </div>
            </div>
        }
        <Tags/>
    </div>
}

const FeePopover = ({record}: FeePopoverProps) => {
    const {tenderly_account} = useContext<ConsumerProps>(ExplorerContext);

    return <ConfigProvider
        theme={{
            token: {
                fontSize: 11,
                sizeStep: 2,
                sizeUnit: 2
            },
        }}
    >
        <Popover
            placement={'leftBottom'}
            title={'交易详情'}
            arrow={{pointAtCenter: true}}
            content={<div style={{width: 300}}>
                <Tabs
                    style={{maxHeight: 600}}
                    items={[
                        {
                            key: 'info',
                            label: '基本信息',
                            children: <div className={'trade'}>
                                <div className={'events'}>
                                    <Space
                                        size={[2, 2]}
                                        style={{width: '100%'}}
                                        split={<Divider/>}
                                        direction={'vertical'}
                                    >
                                        {
                                            record.buy.state == 1n && <Trade
                                                title={'买'}
                                                trade={record.buy}
                                                tokenIn={record.tokenIn}
                                                tokenOut={record.tokenOut}
                                            />
                                        }
                                        {
                                            record.sell.state == 1n && <Trade
                                                title={'卖'}
                                                trade={record.sell}
                                                tokenIn={record.tokenOut}
                                                tokenOut={record.tokenIn}
                                            />
                                        }
                                        {
                                            record.transfer.state == 1n && <Trade
                                                title={'转'}
                                                trade={record.transfer}
                                                tokenIn={record.tokenOut}
                                            />
                                        }

                                        <div className={'trade'}>
                                            <div className={'title'}>
                                                账户余额
                                            </div>

                                            <div className={'token'}>
                                                <div className={'amount'}>
                                                    {FormatNumber(record.account.balanceIn, record.tokenIn.decimals)}
                                                    <span className={'unit'}>{record.tokenIn.symbol}</span>
                                                </div>
                                                <div className={'amount'}>
                                                    {FormatNumber(record.account.balanceOut, record.tokenOut.decimals)}
                                                    <span className={'unit'}>{record.tokenOut.symbol}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Space>
                                </div>
                            </div>
                        },
                        {
                            key: 'buy',
                            label: '购买日志',
                            children: <Logs
                                trade={record.buy}
                                tokenIn={record.tokenIn}
                                tokenOut={record.tokenOut}
                            />
                        },
                        {
                            key: 'sell',
                            label: '卖出日志',
                            children: <Logs
                                trade={record.sell}
                                tokenIn={record.tokenOut}
                                tokenOut={record.tokenIn}
                            />
                        },
                        {
                            key: 'transfer',
                            label: '转账日志',
                            children: <Logs
                                trade={record.transfer}
                                tokenIn={record.tokenIn}
                                tokenOut={record.tokenIn}
                            />
                        },
                    ]}
                >
                </Tabs>
                <Divider/>
                <div>
                    <a
                        href={`https://dashboard.tenderly.co/${tenderly_account?.accountName}/${tenderly_account?.projectName}/fork/${record.simulation.fork_id}/simulation/${record.simulation.id}`}
                        target={'_blank'}
                    >
                        查看详情
                    </a>
                </div>
            </div>}
        >
            <span>
                {`${record.id}-${record.index}`}
                <EyeOutlined style={{cursor: 'pointer', marginLeft: 2}}/>
            </span>
        </Popover>
    </ConfigProvider>
}

export default FeePopover

/*
* 150696d1-de0e-4474-9ce6-e8043a012240
* */