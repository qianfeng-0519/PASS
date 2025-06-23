from rest_framework import serializers
from .models import Todo

class TodoSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    created_by_nickname = serializers.CharField(source='created_by.nickname', read_only=True)
    status_display = serializers.CharField(read_only=True)
    type_display = serializers.CharField(read_only=True)  # 新增
    
    class Meta:
        model = Todo
        fields = [
            'id', 'title', 'description', 'completed', 'is_deleted',
            'todo_type', 'type_display',  # 新增类型字段
            'created_by', 'created_by_username', 'created_by_nickname',
            'status_display', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def validate_title(self, value):
        if len(value.strip()) < 1:
            raise serializers.ValidationError('任务标题不能为空')
        return value.strip()
    
    def validate(self, attrs):
        # 防止修改已删除的任务
        if self.instance and self.instance.is_deleted:
            raise serializers.ValidationError('已删除的任务无法修改')
        return attrs