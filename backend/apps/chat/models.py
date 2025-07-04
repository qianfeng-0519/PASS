from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class ChatConversation(models.Model):
    """聊天对话模型"""
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='conversations',
        verbose_name="用户"
    )
    title = models.CharField(
        max_length=200, 
        default='新对话',
        verbose_name="对话标题"
    )
    created_at = models.DateTimeField(
        default=timezone.now,
        verbose_name="创建时间"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="更新时间"
    )
    
    class Meta:
        ordering = ['-updated_at']
        verbose_name = "聊天对话"
        verbose_name_plural = "聊天对话"
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['-updated_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    def get_first_user_message(self):
        """获取第一条用户消息作为标题"""
        first_message = self.messages.filter(role='user').first()
        if first_message:
            return first_message.content[:50] + ('...' if len(first_message.content) > 50 else '')
        return '新对话'

class ChatMessage(models.Model):
    """聊天消息模型"""
    ROLE_CHOICES = [
        ('user', '用户'),
        ('assistant', 'AI助手'),
    ]
    
    PERSONA_CHOICES = [
        ('DefaultAssistant', '高效机器'),
        ('LifeAssistant', '知心姐姐'),
        ('MilitaryAssistant', '铁血军官'),
        ('DevelopmentAssistant', '睿智博士'),
    ]
    
    conversation = models.ForeignKey(
        ChatConversation, 
        on_delete=models.CASCADE, 
        related_name='messages',
        verbose_name="所属对话"
    )
    role = models.CharField(
        max_length=10, 
        choices=ROLE_CHOICES,
        verbose_name="角色"
    )
    content = models.TextField(verbose_name="消息内容")
    persona = models.CharField(
        max_length=20,
        choices=PERSONA_CHOICES,
        default='DefaultAssistant',
        verbose_name="AI人格",
        help_text="仅对AI助手消息有效"
    )
    referenced_todos = models.JSONField(
        default=list,
        blank=True,
        verbose_name="引用的Todo",
        help_text="存储引用的todo列表，格式为[{id, title, type, priority, description}]"
    )
    created_at = models.DateTimeField(
        default=timezone.now,
        verbose_name="创建时间"
    )
    
    class Meta:
        ordering = ['created_at']
        verbose_name = "聊天消息"
        verbose_name_plural = "聊天消息"
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_role_display()}: {self.content[:50]}..."