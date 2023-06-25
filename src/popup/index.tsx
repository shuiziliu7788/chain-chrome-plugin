import {CollectForm, DecompileForm, Layout, PageForm, TenderlyForm} from "@/components";
import {Card, Tabs} from "antd";
import "./index.less"
import {useTabFlex} from "@/components/style";

const Popup = () => {
    const {styles} = useTabFlex();

    return <Layout>
        <Card
            title={'网络配置'}
            bodyStyle={{
                width: 380,
                height: 520,
                overflowX: 'hidden',
                padding: 0,
            }}
        >
            <Tabs
                className={styles.flex}
                tabPosition={'top'}
                type={'card'}
                size={'small'}
                tabBarGutter={0}
                items={[
                    {
                        key: 'current',
                        label: '当前页面',
                        children: <PageForm/>,
                    },
                    {
                        key: 'compile',
                        label: '编译网络',
                        children: <DecompileForm/>
                    },
                    {
                        key: 'tenderly',
                        label: '测试账号',
                        children: <TenderlyForm/>,
                    },
                    {
                        key: 'collect_form',
                        label: '提示方法',
                        children: <CollectForm/>,
                    },
                ]}
            />
        </Card>
    </Layout>
}

export default Popup