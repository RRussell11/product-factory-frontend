
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Row, Col, Button, Table } from 'antd';
import { useQuery } from '@apollo/react-hooks';
import { GET_CAPABILITIES } from '../../../../graphql/queries';
import { getProp } from '../../../../utilities/filters';
import { randomKeys } from '../../../../utilities/utils';
import AddCapability from '../../../../components/Products/AddCapability';
import PaperClipIcon from '../../../../public/assets/icons/paper-clip.svg';
import { Spinner } from '../../../../components';
import LeftPanelContainer from '../../../../components/HOC/withLeftPanel';

var pluralize = require('pluralize');

type Params = {
  productSlug?: string;
  userRole?: string;
};

const CapabilityList: React.FunctionComponent<Params> = ({ userRole, productSlug }) => {
//   const params: any = match.url.includes("/products")
//     ? matchPath(match.url, {
//         path: "/products/:productSlug/capabilities",
//         exact: false,
//         strict: false
//       })
//     : matchPath(match.url, {
//         path: "/capabilities",
//         exact: false,
//         strict: false
//       })
  const router = useRouter();
  const { data, error, loading, refetch } = useQuery(GET_CAPABILITIES, {
    variables: { productSlug }
  });
  const [dataSource, setDataSource] = useState<any>([]);
  const [showEditModal, setShowEditModal] = useState(false);

  const getBasePath = () => {
    // if (match.url.includes("/products")) {
      return `/products/${productSlug}`;
    // }
    return "";
  }
  const isEdit = false;
  const columns = [
    {
      title: 'Capability',
      dataIndex: 'capability',
      key: 'capability',
      render: (capability: any) => (
        <Link href={capability.url}>{capability.name}</Link>
      )
    },
    {
      title: 'Tasks Todo',
      dataIndex: 'todo_tasks',
      key: 'todo_tasks',
      render: (todo_tasks: any) => (
        <>
          {todo_tasks
            ? todo_tasks.map((task: any) => (
                <Link
                  key={randomKeys()}
                  href={getBasePath() + `/tasks/${task.id}`}
                  className='mt-5'
                >
                  <>#{task.id}</>
                </Link>
              ))
            : null
          }
        </>
      )
    },
    {
      title: 'Tasks Done',
      dataIndex: 'done_tasks',
      key: 'done_tasks',
      render: (done_tasks: any) => (
        <>
          {done_tasks
            ? done_tasks.map((task: any) => (
                <Link
                  key={randomKeys()}
                  href={getBasePath() + `/tasks/${task.id}`}
                  className='mr-5'
                >
                  <>#{task.id}</>
                </Link>
              ))
            : null
          }
        </>
      )
    },
    {
      title: 'Capability attachments',
      dataIndex: 'attachments',
      key: 'attachments',
      render: (attachments: number) => (
        <>
          {
            attachments > 0
              ? (
                  <span>
                    <img
                      alt='paper clip'
                      src={PaperClipIcon}
                      className='mr-3'
                    />
                    {attachments}
                  </span>
                )
              : null
  
          }
        </>
      )
    },
    {
      title: 'Test Coverage',
      dataIndex: 'test_coverage',
      key: 'test_coverage',
    }
  ];

  const fetchData = async () => {
    const { data: capabilities } = await refetch({
      productSlug
    });

    const source: any[] = getProp(capabilities, 'capabilities', []).map((item: any, idx:number) => {
      const done_tasks: any[] = [];
      const todo_tasks: any[] = [];
      
      getProp(item, 'taskSet', []).forEach((child: any) => {
        switch(child.status) {
          case 0:
            todo_tasks.push(child);
            break;
          case 3:
            done_tasks.push(child);
            break;
          default:
            break;
        }
      });

      return {
        key: idx,
        capability: {
          name: item.name,
          url: `/products/${productSlug}/capabilities/${item.id}`
        },
        done_tasks: done_tasks,
        todo_tasks: todo_tasks,
        attachments: item.attachment ? item.attachment.length : 0,
        test_coverage: 0
      };
    });
    setDataSource(source);
  }

  useEffect(() => {
    (async () => { await fetchData(); })();
  }, []);

  if(loading) return <Spinner/>

  return (
    <LeftPanelContainer productSlug={productSlug}>
      {
        !error && (
          <>
            <Row justify="space-between">
              <Col>
                <div className="page-title text-center mb-15">
                  {`Explore ${pluralize("capability", data.capabilities.length, true)}`}
                </div>
              </Col>
              {(userRole === "Manager" || userRole === "Admin") && (
                <Col>
                  <Button onClick={() => setShowEditModal(true)}>
                    Add new capability
                  </Button>
                </Col>
              )}
            </Row>
            {
              showEditModal && <AddCapability
                modal={showEditModal}
                productSlug={productSlug}
                modalType={isEdit}
                closeModal={setShowEditModal}
                submit={fetchData}
              />
            }
            <Table dataSource={dataSource} columns={columns} />
          </>
        )
      }
    </LeftPanelContainer>
  );
};

const mapStateToProps = (state: any) => ({
  user: state.user,
  userRole: state.work.userRole
});

const mapDispatchToProps = (dispatch: any) => ({
});

const CapabilityListContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(CapabilityList);

CapabilityListContainer.getInitialProps = async ({ query}) => {
    const { productSlug } = query;
    return { productSlug };
}
export default CapabilityListContainer;