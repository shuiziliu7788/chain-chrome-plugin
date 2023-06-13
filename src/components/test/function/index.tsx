import {Form, Input} from "antd";
import React, {useState} from "react";
import Name from "./name";
import Inputs from "@/components/test/function/inputs";
import {decode, ParamType} from "@/utils/function";
import Outputs from "@/components/test/function/outputs";


interface FunctionProps {
    initialValues?: any
    onClose?: () => void,
    onCall?: (req: any) => Promise<string>,
}

const Function = ({onClose, onCall, initialValues}: FunctionProps) => {
    const [form] = Form.useForm();
    const type = Form.useWatch<string>('type', form);
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState<boolean>(false);
    const [outputs, setOutputs] = useState<ParamType[]>([]);

    const onFinish = async (values) => {
        setError(undefined)
        setLoading(true)
        setOutputs([])
        try {
            const resp = await onCall(values)
            const outputs = decode(resp, values.outputs);
            setOutputs(outputs)
        } catch (e) {
            setError(e.toString())
        } finally {
            setLoading(false)
        }
    }

    return <Form
        form={form}
        initialValues={initialValues}
        onFinish={onFinish}
    >
        <Name
            loading={loading}
            form={form}
            onClose={onClose}
            type={type}
        />

        <Inputs type={type}/>

        <Outputs
            error={error}
            outputs={outputs}
        />
    </Form>
}

export default Function