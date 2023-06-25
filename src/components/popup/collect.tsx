import {App, Button, Form} from "antd";
import React, {useEffect} from "react";
import {storage} from "./utils"
import Tags from "./tags";


export const CollectForm = () => {
    const {message} = App.useApp()
    const [form] = Form.useForm()

    const onFinish = async ({methods}) => {
        await storage.set("methods", methods)
        message.success("保存成功")
    }

    useEffect(()=>{
        storage.get("methods").then((cfg) => {
            form.setFieldsValue({
                methods:cfg
            })
        }).catch(e => {
            return message.error("获取错误")
        })
    })

    return <Form
        form={form}
        onFinish={onFinish}
        style={{padding: 16}}
        onValuesChange={(changedValues, values) => {
            onFinish(values)
        }}
    >
        <Form.Item name={'methods'}>
            <Tags/>
        </Form.Item>
        <Form.Item>
            <Button block type={'primary'} htmlType={'submit'}>保存</Button>
        </Form.Item>
    </Form>
}

