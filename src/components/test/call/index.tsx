import {Button, Card, Form,} from "antd";
import React, {useState} from "react";
import {ConsumerProps, ExplorerContext} from "@/components/provider";
import Root from "@/components/test/root";
import Function from "@/components/test/function";
import {encode} from "@/utils/function";
import {call, getStorageAt} from "@/utils/eth";
import {storage} from "@/utils/storage";

interface CallProps {
    rpc?: string
}

const Call = ({rpc}: CallProps) => {
    const {contract} = React.useContext<ConsumerProps>(ExplorerContext);
    const [form] = Form.useForm()
    const [funcs, setFuncs] = useState<any[]>([{id: 0, type: 'call'}]);

    const onCall = (values: any): Promise<string> => {
        if (!rpc) {
            throw new Error("请求网络未配置")
        }
        const fields = form.getFieldsValue();
        if (values.type == "call") {
            return call(rpc, {
                from: fields.from,
                to: fields.to,
                value: fields.value,
                gas: fields.gas,
                gasPrice: fields.gasPrice,
                data: encode(values)
            })
        } else {
            const key = storage(values.name, values.keys);
            return getStorageAt(rpc, fields.to, key)
        }
    }

    return <Card className={'tool-card'}>
        <Form
            form={form}
            initialValues={{
                to: contract.address
            }}
            autoComplete="off"
        >
            <Root/>
        </Form>

        {
            funcs.map((func, index) => {
                return <Function
                    key={func.id}
                    initialValues={func}
                    onClose={() => {
                        setFuncs((items) => {
                            return items.filter(item => item.id !== func.id)
                        });
                    }}
                    onCall={onCall}
                />
            })
        }

        <Form.Item>
            <Button
                onClick={() => {
                    setFuncs((funcs) => {
                        return [
                            ...funcs,
                            {
                                id: Math.random(),
                                type: 'call'
                            }
                        ]
                    })
                }}
                style={{width: '100%'}}
                type="dashed">
                添加调用方法
            </Button>
        </Form.Item>
    </Card>
}

export default Call