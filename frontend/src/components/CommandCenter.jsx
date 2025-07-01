import React from 'react';
import { Command } from 'lucide-react';
import CenterBase from './CenterBase';

const CommandCenter = () => {
  return (
    <CenterBase
      title="指挥中心"
      description="协调和执行所有任务"
      todoType="task"
      icon={Command}
      color="yellow"
    />
  );
};

export default CommandCenter;