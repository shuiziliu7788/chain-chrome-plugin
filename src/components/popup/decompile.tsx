import {App, Button, Form, Input} from "antd";
import {Storage} from "@plasmohq/storage";
import React, {useEffect} from "react";


export const DecompileForm = () => {
    const {message} = App.useApp()
    const [form] = Form.useForm()
    const storage = new Storage()

    useEffect(() => {
        storage.get("decompile_network").then(async (decompile_network: string) => {
            form.setFieldsValue({decompile_network})
        }).catch(e => {
            return message.error("获取配置错误" + e.toString())
        })
    }, [])

    const onFinish = async ({decompile_network}) => {
        storage.set("decompile_network", decompile_network).then(() => {
            return message.success("保存成功")
        }).catch(e => {
            return message.error("保存配置错误" + e.toString())
        })
    }

    return <Form
        form={form}
        layout={'vertical'}
        onFinish={onFinish}
        style={{padding: 16}}
    >
        <Form.Item
            name={'decompile_network'}
            label={'反编译网络'}
            rules={[
                {required: true, whitespace: true, message: '请输入反编译网络'}
            ]}
        >
            <Input
                allowClear
                placeholder="请输入反编译网络"/>
        </Form.Item>

        <Form.Item>
            <Button type={'primary'} style={{width: '100%'}} htmlType={'submit'}>保存</Button>
        </Form.Item>
    </Form>
}

