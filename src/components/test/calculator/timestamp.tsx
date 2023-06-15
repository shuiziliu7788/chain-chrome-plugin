import {Button, Form, Input, Space, Typography} from "antd";
import {CheckOutlined, SnippetsOutlined, UndoOutlined} from "@ant-design/icons";
import {useEffect, useState} from "react";
import dayjs from "dayjs";

const {Paragraph} = Typography



const Timestamp = () => {
    const [now, setNow] = useState<number>(dayjs().unix());
    const [date, setDate] = useState(undefined);

    useEffect(() => {
        setDate(dayjs(Number(now)*1000).format("YYYY-MM-DD HH:mm:ss"))
    }, [now])


    return <>
        <Form.Item className={'converter'}>
            <Space.Compact block>
                <Input
                    className={'addon'}
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
                    onClick={() => setNow(dayjs().unix())}
                    icon={<UndoOutlined/>}/>
            </Space.Compact>
        </Form.Item>
        <Form.Item>
            <Space.Compact block>
                <Input
                    className={'addon'}
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
