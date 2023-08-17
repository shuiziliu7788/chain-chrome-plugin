import {App, Button, Select, Space, Tooltip} from "antd";
import {PlusCircleOutlined, UndoOutlined} from "@ant-design/icons";
import React from "react";
import {ConsumerProps, ExplorerContext} from "@/components";
import dayjs from "dayjs";
import {createStyles} from "antd-style";
import DeleteIcon from "@/components/test/node/DeleteIcon";

const {Option} = Select

const useStyle = createStyles(({css}) => ({
    popup: css`
     .ant-select-item-option-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        .anticon-delete {
          display: block !important;
          &:hover {
            color: #ccc;
          }
        }
  }
    `
}))

const Node = () => {
    const {message} = App.useApp()
    const {
        contract,
        forks,
        setCurrentFork,
        forkLoading,
        fetchForks,
        createFork,
        createLoading,
        current_fork
    } = React.useContext<ConsumerProps>(ExplorerContext);

    const {styles} = useStyle();

    return <Space.Compact className={'aflex'} block>
        <Select
            value={current_fork ? current_fork.id : undefined}
            loading={forkLoading}
            className={'select-node'}
            style={{width: "calc(100% - 32px)"}}
            placeholder={`请选择测试节点`}
            popupClassName={styles.popup}
            onSelect={(value, option: any) => {
                setCurrentFork(option.id ? option : undefined)
            }}
            optionLabelProp="label"
        >
            {
                forks.map((item, index) => <Option
                    key={item.json_rpc_url}
                    value={item.id}
                    label={item.name}
                    {...item}
                >
                    {item.name}
                    <DeleteIcon id={item.id}/>
                </Option>)
            }
        </Select>
        <Tooltip title={'刷新节点列表'}>
            <Button
                onClick={() => {
                    fetchForks().catch(e => {
                        return message.error(e)
                    })
                }}
                icon={<UndoOutlined/>}
            />
        </Tooltip>
        <Tooltip placement={'bottomRight'} title={'创建新的节点'}>
            <Button
                loading={createLoading}
                onClick={() => {
                    createFork({
                        description: contract.address ?? `0x`,
                        name: `${contract.token ? contract.token.symbol : 'TEST'}-${dayjs().format("MM月DD HH:mm")}-链:${contract.chain_id}`,
                        network_id: contract.chain_id
                    }).then(res => {
                        console.log("创建成功")
                    }).catch((e) => {
                        message.error((e?.message) ?? "创建 tenderly fork节点失败")
                    })
                }}
                icon={<PlusCircleOutlined/>}
            />
        </Tooltip>
    </Space.Compact>
}

export default Node