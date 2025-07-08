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
    
    # 状态选择 - 根据类型动态显示
    STATUS_CHOICES = {
        'record': [
            ('pending', '待阅'),
            ('archived', '归档'),
        ],
        'requirement': [
            ('pending_evaluation', '待评估'),
            ('decomposed', '已拆解'),
            ('rejected', '已拒绝'),
        ],
        'task': [
            ('todo', '待办'),
            ('on_hold', '搁置'),
            ('cancelled', '取消'),
            ('completed', '完成'),
        ],
        'issue': [
            ('reported', '报告'),
            ('reproduced', '复现'),
            ('fixing', '修复'),
            ('resolved', '解决'),
            ('closed', '关闭'),
        ]
    }
    
    # 获取所有状态选择（用于数据库字段定义）
    ALL_STATUS_CHOICES = []
    for type_statuses in STATUS_CHOICES.values():
        ALL_STATUS_CHOICES.extend(type_statuses)
    
    # 添加优先级选择
    PRIORITY_CHOICES = [
        ('high', '高'),
        ('medium', '中'), 
        ('low', '低'),
        ('none', '无'),
    ]
    
    # 优先级排序权重（数值越小优先级越高）
    PRIORITY_WEIGHTS = {
        'high': 1,
        'medium': 2,
        'low': 3,
        'none': 4,
    }
    
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
    
    # 新增状态字段
    # 移除数据库字段的默认值
    status = models.CharField(
        max_length=30,
        choices=ALL_STATUS_CHOICES,
        blank=True,  # 允许为空
        verbose_name="状态",
        help_text="任务状态"
    )
    
    # 修改save方法
    def save(self, *args, **kwargs):
        """保存时自动设置默认状态"""
        if not self.status:  # 当status为空或空字符串时
            self.status = self.get_default_status_for_type(self.todo_type)
        super().save(*args, **kwargs)
    
    # 新增优先级字段
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='none',
        verbose_name="优先级",
        help_text="任务优先级"
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
        # 按优先级排序，高优先级靠前，然后按创建时间倒序
        ordering = ['priority', '-created_at']
        verbose_name = "待办事项"
        verbose_name_plural = "待办事项"
        indexes = [
            models.Index(fields=['created_by']),
            models.Index(fields=['is_deleted']),
            models.Index(fields=['todo_type']),
            models.Index(fields=['parent_todo_id']),  # 父todo ID索引
            models.Index(fields=['priority']),  # 优先级索引
            models.Index(fields=['status']),  # 状态索引
        ]
    
    def __str__(self):
        return self.title
    
    @property
    def status_display(self):
        """获取状态显示名称"""
        all_choices = dict(self.ALL_STATUS_CHOICES)
        return all_choices.get(self.status, self.status)
    
    @property
    def type_display(self):
        return dict(self.TYPE_CHOICES).get(self.todo_type, self.todo_type)
    
    @property
    def priority_display(self):
        return dict(self.PRIORITY_CHOICES).get(self.priority, self.priority)
    
    @property
    def priority_weight(self):
        """获取优先级权重，用于排序"""
        return self.PRIORITY_WEIGHTS.get(self.priority, 999)
    
    @property
    def available_statuses(self):
        """获取当前类型可用的状态选项"""
        return self.STATUS_CHOICES.get(self.todo_type, [])
    
    def get_default_status_for_type(self, todo_type):
        """获取指定类型的默认状态"""
        defaults = {
            'record': 'pending',
            'requirement': 'pending_evaluation', 
            'task': 'todo',
            'issue': 'reported'
        }
        return defaults.get(todo_type, 'pending')
    
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
        ).order_by('priority', '-created_at')  # 子任务也按优先级排序
    
    @property
    def has_sub_todos(self):
        """检查是否有子任务"""
        return Todo.objects.filter(
            parent_todo_id=self.id,
            is_deleted=False
        ).exists()


class QuickTaskConfig(models.Model):
    """快捷任务配置模型"""
    
    name = models.CharField(
        max_length=50, 
        verbose_name="配置名称",
        help_text="快捷任务名称，将作为按钮显示文字"
    )
    
    title = models.CharField(
        max_length=200, 
        verbose_name="任务标题模板",
        help_text="任务标题模板，支持变量如{date}, {time}, {user}"
    )
    
    description = models.TextField(
        blank=True, 
        verbose_name="任务描述模板",
        help_text="任务描述模板，支持变量替换"
    )
    
    todo_type = models.CharField(
        max_length=20,
        choices=Todo.TYPE_CHOICES,
        default='record',
        verbose_name="任务类型",
        help_text="快捷任务的类型"
    )
    
    priority = models.CharField(
        max_length=20,
        choices=Todo.PRIORITY_CHOICES,
        default='medium',
        verbose_name="优先级",
        help_text="快捷任务的优先级"
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='quick_task_configs',
        verbose_name="创建用户",
        help_text="配置的创建者"
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name="是否启用",
        help_text="是否在舰桥页面显示此快捷按钮"
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "快捷任务配置"
        verbose_name_plural = "快捷任务配置"
        indexes = [
            models.Index(fields=['created_by']),
            models.Index(fields=['is_active']),
            models.Index(fields=['todo_type']),
        ]
        # 确保同一用户下配置名称唯一
        unique_together = ['created_by', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_todo_type_display()})"
    
    def generate_todo_data(self, user):
        """根据配置生成todo数据，支持模板变量替换"""
        from datetime import datetime
        import re
        
        # 定义可用的模板变量
        variables = {
            'date': datetime.now().strftime('%Y-%m-%d'),
            'time': datetime.now().strftime('%H:%M'),
            'datetime': datetime.now().strftime('%Y-%m-%d %H:%M'),
            'user': user.nickname if hasattr(user, 'nickname') else user.username,
            'username': user.username,
        }
        
        # 替换模板变量
        title = self.title
        description = self.description
        
        for var, value in variables.items():
            title = title.replace(f'{{{var}}}', str(value))
            description = description.replace(f'{{{var}}}', str(value))
        
        return {
            'title': title,
            'description': description,
            'todo_type': self.todo_type,
            'priority': self.priority,
            'created_by': user
        }
    
    def create_todo(self, user):
        """根据配置创建新的todo"""
        todo_data = self.generate_todo_data(user)
        return Todo.objects.create(**todo_data)
