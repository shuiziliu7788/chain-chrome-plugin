import {Tooltip} from "antd";
import {InfoCircleOutlined} from "@ant-design/icons";
import React, {CSSProperties} from "react";
import type {TradeInfo} from "./typing";

interface FeeCellProps {
    trade: TradeInfo,
    type: "buy" | "sell" | "transfer",
    isBuy?: boolean
}

interface GasCellProps {
    gas?: bigint
}

interface ErrorCellProps {
    record: {
        error?: string
    }
}

export const ErrorCell = ({record}: ErrorCellProps) => {
    return <Tooltip title={record.error}>
        <InfoCircleOutlined
            style={{
                color: '#ff4d4f',
                cursor: 'pointer'
            }}
        />
    </Tooltip>
}

export const FeeCell = ({trade, type}: FeeCellProps) => {
    if (!trade || trade.state == 0n) {
        return <>--</>
    } else if (trade.state == 1n) {
        return <>{`${(Number(trade.tokenIn.fee + trade.tokenOut.fee) / 100).toFixed(2)}%`}</>
    }

    return <ErrorCell record={{error: trade.error}}/>
}

export const GasCell = ({gas}: GasCellProps) => {
    return <>{gas ? `${(Number(gas) / 10000).toFixed(2)}W` : null}</>
}



