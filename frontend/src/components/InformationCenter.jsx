import React from 'react';
import { Info } from 'lucide-react';
import CenterBase from './CenterBase';

const InformationCenter = () => {
  return (
    <CenterBase
      title="信息中心"
      description="分析和挖掘所有记录"
      todoType="record"
      icon={Info}
      color="blue"
    />
  );
};

export default InformationCenter;