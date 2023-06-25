import {Card, Form} from "antd";
import React, {useState} from "react";
import {ConsumerProps, ExplorerContext} from "@/components";
import Root from "@/components/test/root";
import Name from "@/components/test/function/name";
import type {ParamType} from "@/utils/function";
import {decode, encode} from "@/utils/function";
import Inputs from "@/components/test/function/inputs";
import Outputs from "@/components/test/function/outputs";
import {call} from "@/utils/eth";
import type {Response} from "@/types/tenderly/response";

const Send = () => {
    const {contract, submitSimulation, tenderly_account} = React.useContext<ConsumerProps>(ExplorerContext);

    const [form] = Form.useForm()
    const [loading, setLoading] = useState<boolean>(false);
    const [outputs, setOutputs] = useState<ParamType[]>([]);
    const [response, setResponse] = useState<Response>();
    const [error, setError] = useState<string>();
    const type = Form.useWatch<string>('type', form);


    const onSend = async () => {
        setError(undefined)
        setResponse(undefined)
        setOutputs([])
        setLoading(true)
        try {
            const fields = form.getFieldsValue();

            const resp = await submitSimulation({
                from: fields.from,
                gas: fields.gas,
                gas_price: fields.gasPrice,
                input: encode(fields),
                save: true,
                to: fields.to,
                value: fields.value,
                generate_access_list: true,
                skip_fork_head_update: false,
                block_header:fields.block_header,
            })
            setResponse(resp)
            if (resp.transaction.error_message) {
                setError(`${resp.transaction.error_info.error_message} form ${resp.transaction.error_info.address}`)
                return
            }
            const outputs = decode(resp.transaction.transaction_info.call_trace.output, fields.outputs);
            setOutputs(outputs)
        } catch (e) {
            setError(e.toString())
        } finally {
            setLoading(false)
        }
    }

    return <Card className={'tool-card'}>
        <Form
            form={form}
            initialValues={{
                to: contract.address,
                type: 'call'
            }}
            autoComplete="off"
            onFinish={onSend}
        >
            <Root rewriteHeader/>
            <Name
                debug={true}
                loading={loading}
                form={form}
                type={type}
            />
            <Inputs type={type}/>
            <Outputs
                error={error}
                outputs={outputs}
            />
            {
                response && <a
                    style={{float: 'right'}}
                    target={'_blank'}
                    href={`https://dashboard.tenderly.co/${tenderly_account.accountName}/${tenderly_account.projectName}/fork/${response.simulation.fork_id}/simulation/${response.simulation.id}/state-diff`}
                >
                    打开调试页面
                </a>
            }
        </Form>
    </Card>
}

export default Send