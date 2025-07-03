from django.db import models
from django.utils import timezone
from django.conf import settings

class Todo(models.Model):
    # Django会自动创建id字段作为主键
    # id = models.AutoField(primary_key=True)  # 这行是隐式的，不需要写出来
    
    # 添加类型选择
    TYPE_CHOICES = [
        ('record', '记录'),
        ('requirement', '需求'),
        ('task', '任务'),
        ('issue', '故障'),
    ]
    
    title = models.CharField(max_length=200, help_text="任务标题")
    description = models.TextField(blank=True, help_text="任务描述")
    completed = models.BooleanField(default=False, help_text="是否完成")
    
    # 新增类型字段
    todo_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='record',
        verbose_name="类型",
        help_text="todo类型"
    )
    
    # 新增字段
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='todos',
        verbose_name="创建人",
        help_text="任务创建者"
    )
    
    # 父todo ID字段 - 存储父todo的ID
    parent_todo_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="父任务ID",
        help_text="父级任务的ID，用于建立任务层级关系"
    )
    
    is_deleted = models.BooleanField(default=False, verbose_name="删除标记", help_text="软删除标记")
    created_at = models.DateTimeField(auto_now_add=True, help_text="创建时间")
    updated_at = models.DateTimeField(auto_now=True, help_text="更新时间")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "待办事项"
        verbose_name_plural = "待办事项"
        indexes = [
            models.Index(fields=['created_by']),
            models.Index(fields=['is_deleted']),
            models.Index(fields=['todo_type']),
            models.Index(fields=['parent_todo_id']),  # 父todo ID索引
        ]
    
    def __str__(self):
        return self.title
    
    @property
    def status_display(self):
        return "已完成" if self.completed else "未完成"
    
    @property
    def type_display(self):
        return dict(self.TYPE_CHOICES).get(self.todo_type, self.todo_type)
    
    def soft_delete(self):
        """软删除"""
        self.is_deleted = True
        self.save(update_fields=['is_deleted', 'updated_at'])
    
    def restore(self):
        """恢复删除"""
        self.is_deleted = False
        self.save(update_fields=['is_deleted', 'updated_at'])
    
    @property
    def parent_todo(self):
        """获取父任务对象"""
        if self.parent_todo_id:
            try:
                return Todo.objects.get(id=self.parent_todo_id, is_deleted=False)
            except Todo.DoesNotExist:
                return None
        return None
    
    def get_sub_todos(self):
        """获取子任务列表"""
        return Todo.objects.filter(
            parent_todo_id=self.id,
            is_deleted=False
        ).order_by('-created_at')
    
    @property
    def has_sub_todos(self):
        """检查是否有子任务"""
        return Todo.objects.filter(
            parent_todo_id=self.id,
            is_deleted=False
        ).exists()
