import React from 'react';
import { Target } from 'lucide-react';
import CenterBase from './CenterBase';

const StrategicCenter = () => {
  return (
    <CenterBase
      title="战略中心"
      description="梳理和拆解所有需求"
      todoType="requirement"
      icon={Target}
      color="green"
    />
  );
};

export default StrategicCenter;