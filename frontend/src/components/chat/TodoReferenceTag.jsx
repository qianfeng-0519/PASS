import React from 'react';

const TodoReferenceTag = ({ todo, onRemove }) => {
  // Todo类型颜色配置
  const typeColors = {
    record: 'bg-blue-100 text-blue-800 border-blue-200',
    requirement: 'bg-green-100 text-green-800 border-green-200',
    task: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    bug: 'bg-red-100 text-red-800 border-red-200'
  };

  const truncateTitle = (title) => {
    return title.length > 15 ? title.substring(0, 15) + '...' : title;
  };

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs border ${
      typeColors[todo.todo_type] || 'bg-gray-100 text-gray-800 border-gray-200'
    }`}>
      <span className="truncate" title={todo.title}>
        {truncateTitle(todo.title)}
      </span>
      <button
        onClick={() => onRemove(todo.id)}
        className="ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
        title="移除引用"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default TodoReferenceTag;