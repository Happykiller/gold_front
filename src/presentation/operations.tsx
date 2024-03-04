import * as React from 'react';
import { Trans } from 'react-i18next';

import '@presentation/common.scss';
import Bar from '@presentation/bar';
import { Footer } from '@presentation/footer';

export const Operations = () => {
  const [operations, setOperations] = React.useState<any[]>(null);
  const [qry, setQry] = React.useState({
    loading: true,
    data: null,
    error: null
  });

  const Operation = (props: { operation: any }) => {
    const { operation } = props;
  
    return (
      <div>{operation.id}</div>
    )
  }

  return (
    <div className="app">
      <Bar/>
      <div className="parent_container">
        <div className="container">
          <div className='title'>
            <Trans>operations.title</Trans>
          </div>
          <div>
            {operations?.map((operation:any) => (
              <Operation key={operation.id} operation={operation} />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}