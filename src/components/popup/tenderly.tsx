import {App, Button, Form, Input} from "antd";
import {useEffect} from "react";
import {storage} from "./utils"


export const TenderlyForm = () => {
    const {message} = App.useApp()
    const [form] = Form.useForm()
    const onFinish = async (values) => {
        storage.set('tenderly', values).then(() => {
            return message.success("保存成功")
        }).catch(e => {
            return message.error("保存错误")
        })
    }

    useEffect(() => {
        storage.get("tenderly").then((cfg) => {
            form.setFieldsValue(cfg)
        }).catch(e => {
            return message.error("获取错误")
        })
    }, [])


    return <Form
        layout={'vertical'}
        form={form}
        onFinish={onFinish}
        style={{padding: 16}}
    >
        <Form.Item required label={'用户名'} name={'accountName'}>
            <Input placeholder={'请输入用户名'}/>
        </Form.Item>
        <Form.Item required label={'秘钥'} name={'accessKey'}>
            <Input placeholder={'请输入秘钥'}/>
        </Form.Item>
        <Form.Item required label={'项目名称'} name={'projectName'}>
            <Input placeholder={'请输入项目名称'}/>
        </Form.Item>
        <Form.Item>
            <Button htmlType={'submit'} type={'primary'} block>保存</Button>
        </Form.Item>
    </Form>

}

