from django.db import models
from django.utils import timezone
from django.conf import settings


class Todo(models.Model):
    title = models.CharField(max_length=200, help_text="任务标题")
    description = models.TextField(blank=True, help_text="任务描述")
    completed = models.BooleanField(default=False, help_text="是否完成")
    # 新增字段
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        default=1,
        related_name='todos',  # ✅ 添加related_name
        verbose_name="创建人",
        help_text="任务创建者"
    )
    is_deleted = models.BooleanField(default=False, verbose_name="删除标记", help_text="软删除标记")
    # 现有字段
    created_at = models.DateTimeField(auto_now_add=True, help_text="创建时间")
    updated_at = models.DateTimeField(auto_now=True, help_text="更新时间")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "待办事项"
        verbose_name_plural = "待办事项"
        indexes = [
            models.Index(fields=['created_by']),
            models.Index(fields=['is_deleted']),
        ]
    
    def __str__(self):
        return self.title
    
    @property
    def status_display(self):
        return "已完成" if self.completed else "未完成"
    
    def soft_delete(self):
        """软删除"""
        self.is_deleted = True
        self.save(update_fields=['is_deleted', 'updated_at'])
    
    def restore(self):
        """恢复删除"""
        self.is_deleted = False
        self.save(update_fields=['is_deleted', 'updated_at'])
