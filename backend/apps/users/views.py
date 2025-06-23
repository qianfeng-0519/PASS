from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q
from .models import User
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    UserProfileUpdateSerializer,
    PasswordChangeSerializer,
    AdminUserListSerializer,
    AdminUserDetailSerializer,
    AdminUserUpdateSerializer,
    AdminPasswordResetSerializer,
    AdminRoleUpdateSerializer
)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    """用户注册"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': '注册成功',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login(request):
    """用户登录"""
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        user.update_last_login()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': '登录成功',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    """用户个人信息"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        if self.request.method == 'PUT' or self.request.method == 'PATCH':
            return UserProfileUpdateSerializer
        return UserSerializer

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """修改密码"""
    serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': '密码修改成功'}, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class IsAdminUser(permissions.BasePermission):
    """管理员权限检查"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff

class AdminUserListView(generics.ListAPIView):
    """管理员查看用户列表"""
    serializer_class = AdminUserListSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = User.objects.all().order_by('-created_at')
        
        # 搜索功能
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(nickname__icontains=search)
            )
        
        # 状态筛选
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # 角色筛选
        is_staff = self.request.query_params.get('is_staff', None)
        if is_staff is not None:
            queryset = queryset.filter(is_staff=is_staff.lower() == 'true')
        
        return queryset

class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    """管理员查看和更新用户详情"""
    queryset = User.objects.all()
    permission_classes = [IsAdminUser]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return AdminUserUpdateSerializer
        return AdminUserDetailSerializer
    
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        
        # 防止管理员意外禁用自己
        if user == request.user and 'is_active' in request.data and not request.data['is_active']:
            return Response(
                {'error': '不能禁用自己的账号'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().update(request, *args, **kwargs)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_toggle_user_status(request, user_id):
    """管理员切换用户状态（启用/禁用）"""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': '用户不存在'}, status=status.HTTP_404_NOT_FOUND)
    
    # 防止管理员禁用自己
    if user == request.user:
        return Response(
            {'error': '不能禁用自己的账号'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user.is_active = not user.is_active
    user.save()
    
    action = '启用' if user.is_active else '禁用'
    return Response({
        'message': f'用户 {user.username} 已{action}',
        'user': AdminUserDetailSerializer(user).data
    })

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_delete_user(request, user_id):
    """管理员删除用户（永久删除）"""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': '用户不存在'}, status=status.HTTP_404_NOT_FOUND)
    
    # 防止管理员删除自己
    if user == request.user:
        return Response(
            {'error': '不能删除自己的账号'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # 防止删除超级管理员
    if user.is_superuser:
        return Response(
            {'error': '不能删除超级管理员账号'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # 保存用户名用于返回消息
    username = user.username
    
    # 真正删除用户记录
    user.delete()
    
    return Response({
        'message': f'用户 {username} 已被永久删除'
    })

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_user_stats(request):
    """管理员获取用户统计信息"""
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    staff_users = User.objects.filter(is_staff=True).count()
    
    return Response({
        'total_users': total_users,
        'active_users': active_users,
        'inactive_users': total_users - active_users,
        'staff_users': staff_users,
        'regular_users': total_users - staff_users
    })

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_reset_password(request, user_id):
    """管理员重置用户密码"""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': '用户不存在'}, status=status.HTTP_404_NOT_FOUND)
    
    # 防止重置超级管理员密码（除非自己是超级管理员）
    if user.is_superuser and not request.user.is_superuser:
        return Response(
            {'error': '只有超级管理员可以重置超级管理员密码'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = AdminPasswordResetSerializer(data=request.data)
    if serializer.is_valid():
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({
            'message': f'用户 {user.username} 的密码已重置'
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_update_role(request, user_id):
    """管理员更新用户角色"""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': '用户不存在'}, status=status.HTTP_404_NOT_FOUND)
    
    # 防止修改自己的角色
    if user == request.user:
        return Response(
            {'error': '不能修改自己的角色'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # 只有超级管理员可以设置超级管理员角色
    if 'is_superuser' in request.data and not request.user.is_superuser:
        return Response(
            {'error': '只有超级管理员可以设置超级管理员角色'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = AdminRoleUpdateSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': f'用户 {user.username} 的角色已更新',
            'user': AdminUserDetailSerializer(user).data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
