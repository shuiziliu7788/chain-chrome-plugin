import {DeleteOutlined, RedoOutlined} from "@ant-design/icons";
import React, {useState} from "react";
import {ConsumerProps, ExplorerContext} from "@/components";
import {App} from "antd";

interface DeleteIconProps {
    id: string
}

const DeleteIcon = ({id}: DeleteIconProps) => {
    const {message} = App.useApp()
    const {removeFork, fetchForks} = React.useContext<ConsumerProps>(ExplorerContext);
    const [loading, setLoading] = useState(false)


    const onDelete = async (event) => {
        event.stopPropagation();
        setLoading(true)
        try {
            await removeFork(id)
            message.success("删除成功");
            return fetchForks();
        } catch (e) {
            message.error("删除失败");
        } finally {
            setLoading(true)
        }
    }

    return loading ? <RedoOutlined
        spin={true}
        className={'remove'}
    /> : <DeleteOutlined
        onClick={onDelete}
        style={{display: 'none'}}
        className={'remove'}
    />
}

export default DeleteIcon