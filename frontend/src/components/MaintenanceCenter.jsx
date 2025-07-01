import React from 'react';
import { Wrench } from 'lucide-react';
import CenterBase from './CenterBase';

const MaintenanceCenter = () => {
  return (
    <CenterBase
      title="维护中心"
      description="处理和跟踪所有问题"
      todoType="issue"
      icon={Wrench}
      color="red"
    />
  );
};

export default MaintenanceCenter;