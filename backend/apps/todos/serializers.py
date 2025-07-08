from rest_framework import serializers
from .models import Todo, QuickTaskConfig

class TodoSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    created_by_nickname = serializers.CharField(source='created_by.nickname', read_only=True)
    status_display = serializers.CharField(read_only=True)
    type_display = serializers.CharField(read_only=True)
    priority_display = serializers.CharField(read_only=True)  # 新增优先级显示
    available_statuses = serializers.SerializerMethodField()  # 新增：可用状态选项
    
    class Meta:
        model = Todo
        fields = [
            'id', 'title', 'description', 'completed', 'is_deleted',
            'todo_type', 'type_display',
            'priority', 'priority_display',  # 新增优先级字段
            'status', 'status_display', 'available_statuses',  # 新增状态相关字段
            'created_by', 'created_by_username', 'created_by_nickname',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_available_statuses(self, obj):
        """获取当前todo类型的可用状态选项"""
        return obj.available_statuses
    
    def validate_title(self, value):
        if len(value.strip()) < 1:
            raise serializers.ValidationError('任务标题不能为空')
        return value.strip()
    
    def validate_status(self, value):
        """验证状态值是否有效"""
        if self.instance:
            # 更新时验证状态是否在可用选项中
            available = dict(self.instance.available_statuses)
            if value not in available:
                raise serializers.ValidationError(f'无效的状态值: {value}')
        return value
    
    def validate(self, attrs):
        # 防止修改已删除的任务
        if self.instance and self.instance.is_deleted:
            raise serializers.ValidationError('已删除的任务无法修改')
        
        # 创建时验证状态
        if not self.instance and 'status' in attrs and 'todo_type' in attrs:
            from .models import Todo
            temp_todo = Todo(todo_type=attrs['todo_type'])
            available = dict(temp_todo.available_statuses)
            if attrs['status'] not in available:
                raise serializers.ValidationError(f'无效的状态值: {attrs["status"]}')
        
        return attrs


class QuickTaskConfigSerializer(serializers.ModelSerializer):
    """快捷任务配置序列化器"""
    
    todo_type_display = serializers.CharField(source='get_todo_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = QuickTaskConfig
        fields = [
            'id', 'name', 'title', 'description', 'todo_type', 'todo_type_display',
            'priority', 'priority_display', 'is_active', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def validate_name(self, value):
        """验证配置名称唯一性"""
        user = self.context['request'].user
        queryset = QuickTaskConfig.objects.filter(created_by=user, name=value)
        
        # 如果是更新操作，排除当前对象
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError("您已经有同名的快捷任务配置了")
        
        return value
    
    def create(self, validated_data):
        """创建时自动设置创建者"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class QuickTaskConfigCreateTodoSerializer(serializers.Serializer):
    """根据快捷任务配置创建todo的序列化器"""
    
    def create(self, validated_data):
        """根据配置创建todo"""
        config = self.context['config']
        user = self.context['request'].user
        return config.create_todo(user)