import type {TradeInfo} from "./utils";
import {Tooltip} from "antd";
import {InfoCircleOutlined} from "@ant-design/icons";
import React, {CSSProperties} from "react";

interface FeeCellProps {
    info: TradeInfo,
    isBuy?: boolean
}

interface GasCellProps {
    gas?: bigint
}

const styleIcon: CSSProperties = {
    color: '#ff4d4f',
    cursor: 'pointer'
}

export const FeeCell = ({info, isBuy}: FeeCellProps) => {

    if (!info) {
        return null
    } else if (info.state == 0) {
        return <>--</>
    } else if (info.state == 1) {
        return <>{`${isBuy ? info.tokenOut.fee : info.tokenIn.fee}%`}</>
    }
    return <Tooltip title={info.error}>
        <InfoCircleOutlined style={styleIcon}/>
    </Tooltip>
}

export const GasCell = ({gas}: GasCellProps) => {
    return <>{gas ? `${(Number(gas) / 10000).toFixed(2)}W` : null}</>
}