import {App, Button, Col, Form, Input, Row, Upload} from "antd";
import {useEffect} from "react";
import {sendToBackground} from "@plasmohq/messaging";
import type {Download} from "@/background/messages/download";
import type {RcFile} from "antd/es/upload/interface";
import type {Explorer} from "@/components";
import {formatted, getAllConfig, getCurrentTabHost, storage} from "./utils";
import {useStyle} from "./style";

const key = "popup_page"


export const PageForm = () => {
    const [form] = Form.useForm()
    const watch = Form.useWatch<Explorer>([], form);

    const {message} = App.useApp();

    const {styles} = useStyle();

    const onFinish = async (cfg: Explorer) => {
        message.loading({content: "正在保存", key, duration: 0})
        try {
            const host = watch.host
            if (!/[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/.test(host)) {
                message.error({content: "当前域名不支持开启", key})
                return
            }
            await storage.set(host, {
                ...cfg,
                enable: true,
            })
            if (!cfg.enable) {
                form.setFieldValue("enable", true)
                await chrome.tabs.reload()
            }
            message.success({content: "保存成功", key})
        } catch (e) {
            message.error({content: "保存错误", key})
        }
    }

    const onUnload = async () => {
        message.loading({content: "正在移除注入", key, duration: 0})
        try {
            await storage.remove(watch.host)
            form.resetFields([
                'enable',
                'rpc',
                'developer_host',
                'secret_key',
                'router',
                'tokens',
            ])
            await chrome.tabs.reload()
            message.success({content: "移除成功", key, duration: 3})
        } catch (e) {
            message.error({content: "移除错误", key, duration: 3})
        }
    }

    const Export = async () => {
        try {
            const cfg = await getAllConfig()
            const json = JSON.stringify(cfg, null, 2);
            await sendToBackground<Download, boolean>({
                name: "download",
                body: {
                    name: `config.json`,
                    body: json,
                    type: ".json",
                }
            })
        } catch (e) {
            message.error(e.toString())
        }
    }

    const onUpload = async (file: RcFile) => {
        message.loading({content: "正在解析配置", key, duration: 0})
        try {
            if (file.type != 'application/json') {
                message.error({content: "配置文件格式错误", key})
                return
            }
            const all = await getAllConfig();
            const parse = JSON.parse(await file.text());
            const keys = Object.keys(formatted(parse, all));
            await storage.removeAll()
            for (let i = 0; i < keys.length; i++) {
                await storage.set(keys[i], parse[keys[i]])
            }
            message.success({content: "导入成功", key, duration: 3})
        } catch (e) {
            console.log(e)
            message.error({content: e.toString(), key})
        }
    }

    useEffect(() => {
        getCurrentTabHost().then(async (host) => {
            // 获取开发者HOST
            form.setFieldsValue({host})
            storage.get<Explorer>(host).then((explorer) => {
                form.setFieldsValue(explorer)
            })
        }).catch(e => {
            console.error(e)
        })
    }, [])

    return <Form
        form={form}
        layout={'vertical'}
        initialValues={{
            router: [],
            tokens: [],
        }}
        onFinish={onFinish}
        style={{padding: 16}}
    >
        <Form.Item name={'enable'} hidden>
            <Input/>
        </Form.Item>
        <Form.Item name={'router'} hidden>
            <Input/>
        </Form.Item>
        <Form.Item name={'tokens'} hidden>
            <Input/>
        </Form.Item>

        <Form.Item name={'host'} required label={`当前浏览器`}>
            <Input disabled/>
        </Form.Item>

        <Form.Item
            rules={[{required: true, whitespace: true, message: '请输入节点网络'}]}
            name={'rpc'}
            label={`节点网络`}>
            <Input
                allowClear
                placeholder="请输入RPC"
                onChange={() => {
                    if (!watch.developer_host && watch.host) {
                        form.setFieldValue(
                            'developer_host',
                            `https://${watch.host.split(".").length == 2 ? 'api.' : ''}${watch.host}/api`
                        )
                    }
                }}
            />
        </Form.Item>
        <Form.Item
            name={'developer_host'}
            label={`开发者域名`}
        >
            <Input
                allowClear
                placeholder="请输入开发者域名"
            />
        </Form.Item>

        <Form.Item
            name={'secret_key'}
            label={`开发者秘钥`}
        >
            <Input
                allowClear
                placeholder="请输入开发者秘钥，可以为空"
            />
        </Form.Item>

        <Form.Item>
            <Row gutter={[16, 16]}>
                {
                    (watch && watch.enable) ? <>
                        <Col span={12}>
                            <Button
                                block
                                type={'primary'}
                                htmlType={'submit'}
                            >
                                保存配置
                            </Button>
                        </Col>
                        <Col span={12}>
                            <Button
                                block
                                danger
                                type={'primary'}
                                onClick={onUnload}
                            >
                                关闭插件
                            </Button>
                        </Col>
                    </> : <Col span={24}>
                        <Button
                            block
                            type={'primary'}
                            htmlType={'submit'}
                        >
                            开启插件
                        </Button>
                    </Col>
                }
                <Col span={12}>
                    <Button
                        block
                        type={'primary'}
                        onClick={Export}
                    >
                        导出配置
                    </Button>
                </Col>
                <Col span={12}>
                    <Upload
                        showUploadList={false}
                        accept={'.json'}
                        className={styles.upload}
                        beforeUpload={onUpload}
                    >
                        <Button block type={'primary'}>
                            导入配置
                        </Button>
                    </Upload>
                </Col>
            </Row>
        </Form.Item>

    </Form>
}