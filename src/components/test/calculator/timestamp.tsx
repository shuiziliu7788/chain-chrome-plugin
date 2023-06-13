import {Button, Form, Input, Space, Typography} from "antd";
import {CheckOutlined, SnippetsOutlined, UndoOutlined} from "@ant-design/icons";
import {useEffect, useState} from "react";

const {Paragraph} = Typography

const getNow = () => {
    return parseInt(String(new Date().getTime() / 1000))
}


const getData = (now) => {
    let date = new Date(now * 1000);
    let YY = date.getFullYear() + "-";
    let MM = (date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1) + "-";
    let DD = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    let hh = (date.getHours() < 10 ? "0" + date.getHours() : date.getHours()) + ":";
    let mm = (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) + ":";
    let ss = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    return YY + MM + DD + " " + hh + mm + ss;
}

const Timestamp = () => {
    const [now, setNow] = useState<number>(getNow());
    const [date, setDate] = useState(undefined);

    useEffect(() => {
        setDate(getData(now))
    }, [now])


    return <>
        <Form.Item className={'converter'}>
            <Space.Compact block>
                <Input
                    value={now}
                    allowClear
                    min={0}
                    style={{width: 'calc(100% - 32px)'}}
                    addonBefore="时间"
                    onChange={(e: any) => {
                        setNow(e.target.value)
                    }}
                />
                <Button
                    onClick={() => {
                        setNow(getNow())
                    }}
                    icon={<UndoOutlined/>}/>
            </Space.Compact>
        </Form.Item>
        <Form.Item>
            <Space.Compact block>
                <Input
                    disabled
                    value={date}
                    style={{width: 'calc(100% - 32px)'}}
                    addonBefore="日期"/>
                <Paragraph
                    style={{display: 'inline-block', width: "32px"}}
                    copyable={{
                        text: date,
                        icon: [<Button icon={<SnippetsOutlined/>}/>, <Button icon={<CheckOutlined/>}/>]
                    }}/>
            </Space.Compact>
        </Form.Item>
    </>
}

export default Timestamp
