import {useEffect, useState} from "react";
import dayjs from "dayjs";
import {FormatNumber} from "@/utils/number";
import {Avatar, Typography} from "antd";
import {CheckOutlined, SnippetsOutlined} from "@ant-design/icons";

const {Paragraph} = Typography


export interface PluginProps {
    value: string
    type: string
    decimals: number
}

const Amount = ({value, decimals}: PluginProps) => {
    const [num, setNumber] = useState("");
    const [time, setTime] = useState("");

    useEffect(() => {
        if (/^\d{10}$/.test(value)) {
            setTime(dayjs.unix(Number(value)).format('YYYY-MM-DD HH:mm:ss'))
        }
        if (value == '0' || decimals == 0) {
            setNumber("")
            return
        }
        try {
            const formatNumber = FormatNumber(value, decimals);
            setNumber(String(formatNumber))
        } catch (e) {
            console.error(e)
        }
    }, [])

    return <>
        {
            time && <div>
                <span>{time}</span>
                <Paragraph
                    className={'clipboard'}
                    style={{marginBottom: 0, display: "inline-block"}}
                    copyable={{
                        tooltips: ['复制时间', '复制成功'],
                        text: time,
                        icon: [
                            <Avatar size={16} icon={<SnippetsOutlined/>}/>,
                            <Avatar size={16} icon={<CheckOutlined/>}/>,
                        ]
                    }}/>
            </div>
        }
        {
            num && <div>
                <span>{num}</span>
                <Paragraph
                    className={'clipboard'}
                    style={{marginBottom: 0, display: "inline-block"}}
                    copyable={{
                        tooltips: [`复制`, '复制成功'],
                        text: num.toString(),
                        icon: [
                            <Avatar size={18} icon={<SnippetsOutlined/>}/>,
                            <Avatar size={18} icon={<CheckOutlined/>}/>,
                        ]
                    }}/>
            </div>
        }
    </>
}


export default Amount