from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    """扩展的用户模型"""
    nickname = models.CharField(max_length=50, verbose_name="昵称", help_text="用户昵称")
    last_login_time = models.DateTimeField(null=True, blank=True, verbose_name="最后登录时间")
    is_active = models.BooleanField(default=True, verbose_name="账户状态", help_text="是否启用账户")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="注册时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    
    class Meta:
        verbose_name = "用户"
        verbose_name_plural = "用户"
        db_table = 'auth_user_extended'
    
    def __str__(self):
        return f"{self.username} ({self.nickname})"
    
    def update_last_login(self):
        """更新最后登录时间"""
        self.last_login_time = timezone.now()
        self.save(update_fields=['last_login_time'])
