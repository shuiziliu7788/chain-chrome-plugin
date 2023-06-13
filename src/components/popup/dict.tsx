import {App, Button, Form} from "antd";
import Tags from "./tags";
import {Storage} from "@plasmohq/storage";
import {useEffect} from "react";

const storage = new Storage()

export const DictForm = () => {
    const [form] = Form.useForm()
    const {message} = App.useApp();

    const onFinish = (values) => {
        storage.set('dict', values).then(() => {
            return message.success("保存成功")
        }).catch(e => {
            return message.error("保存错误" + e.toString())
        })
    }

    useEffect(() => {
        storage.get("dict").then(async (dict: any) => {
            form.setFieldsValue(dict)
        }).catch(e => {
            return message.error("获取错误" + e.toString())
        })
    }, [])

    return <Form
        form={form}
        layout={'vertical'}
        onFinish={onFinish}
        style={{padding: 16}}
        onValuesChange={(changedValues, values) => {
            onFinish(values)
        }}
    >
        <Form.Item name={'owner'} label={'管理员'}>
            <Tags/>
        </Form.Item>
        <Form.Item name={'pair'} label={'池子'}>
            <Tags/>
        </Form.Item>
        <Form.Item name={'router'} label={'路由'}>
            <Tags/>
        </Form.Item>
        <Form.Item>
            <Button block type={'primary'} htmlType={'submit'}>保存</Button>
        </Form.Item>
    </Form>
}

