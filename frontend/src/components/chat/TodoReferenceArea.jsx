import React from 'react';
import TodoReferenceTag from './TodoReferenceTag';

const TodoReferenceArea = ({ referencedTodos, onRemoveTodo }) => {
  if (!referencedTodos || referencedTodos.length === 0) {
    return null;
  }

  return (
    <div className="mb-2 p-2 bg-gray-50 rounded-md border">
      <div className="flex flex-wrap gap-1">
        {referencedTodos.map((todo) => (
          <TodoReferenceTag
            key={todo.id}
            todo={todo}
            onRemove={onRemoveTodo}
          />
        ))}
      </div>
    </div>
  );
};

export default TodoReferenceArea;