from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User

class UserRegistrationSerializer(serializers.ModelSerializer):
    """用户注册序列化器"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'nickname', 'password', 'confirm_password')
    
    def validate_username(self, value):
        if len(value) < 4:
            raise serializers.ValidationError("用户名至少需要4个字符")
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("用户名已存在")
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("邮箱已被注册")
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("两次输入的密码不一致")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        return user

class UserLoginSerializer(serializers.Serializer):
    """用户登录序列化器"""
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('用户名或密码错误')
            if not user.is_active:
                raise serializers.ValidationError('账号已被封禁，请联系管理员')
            attrs['user'] = user
        return attrs

class UserSerializer(serializers.ModelSerializer):
    """用户信息序列化器"""
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'nickname', 'is_staff', 'is_active', 
                 'last_login_time', 'created_at', 'updated_at')
        read_only_fields = ('id', 'username', 'is_staff', 'created_at', 'updated_at')

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """用户信息更新序列化器"""
    class Meta:
        model = User
        fields = ('nickname', 'email')
    
    def validate_email(self, value):
        user = self.instance
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("邮箱已被其他用户使用")
        return value

class PasswordChangeSerializer(serializers.Serializer):
    """密码修改序列化器"""
    current_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    confirm_password = serializers.CharField()
    
    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('当前密码错误')
        return value
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError('两次输入的新密码不一致')
        return attrs

class AdminUserListSerializer(serializers.ModelSerializer):
    """管理员用户列表序列化器"""
    todos_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'nickname', 'is_staff', 'is_active', 
                 'is_superuser', 'last_login_time', 'created_at', 'todos_count')
        read_only_fields = ('id', 'username', 'created_at')
    
    def get_todos_count(self, obj):
        """获取用户的待办事项数量"""
        return obj.todos.filter(is_deleted=False).count()

class AdminUserDetailSerializer(serializers.ModelSerializer):
    """管理员用户详情序列化器"""
    todos_count = serializers.SerializerMethodField()
    completed_todos_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'nickname', 'is_staff', 'is_active', 
                 'is_superuser', 'last_login_time', 'created_at', 'updated_at',
                 'todos_count', 'completed_todos_count')
        read_only_fields = ('id', 'username', 'created_at', 'updated_at')
    
    def get_todos_count(self, obj):
        """获取用户的待办事项总数"""
        return obj.todos.filter(is_deleted=False).count()
    
    def get_completed_todos_count(self, obj):
        """获取用户已完成的待办事项数量"""
        return obj.todos.filter(is_deleted=False, completed=True).count()

class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """管理员用户更新序列化器"""
    class Meta:
        model = User
        fields = ('nickname', 'email', 'is_staff', 'is_active')
    
    def validate_email(self, value):
        user = self.instance
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("邮箱已被其他用户使用")
        return value

class AdminPasswordResetSerializer(serializers.Serializer):
    """管理员重置用户密码序列化器"""
    new_password = serializers.CharField(validators=[validate_password])
    confirm_password = serializers.CharField()
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError('两次输入的密码不一致')
        return attrs

class AdminRoleUpdateSerializer(serializers.ModelSerializer):
    """管理员角色更新序列化器"""
    class Meta:
        model = User
        fields = ('is_staff', 'is_superuser')
    
    def validate(self, attrs):
        # 防止移除最后一个超级管理员
        if 'is_superuser' in attrs and not attrs['is_superuser']:
            if self.instance.is_superuser:
                superuser_count = User.objects.filter(is_superuser=True).count()
                if superuser_count <= 1:
                    raise serializers.ValidationError('不能移除最后一个超级管理员')
        return attrs