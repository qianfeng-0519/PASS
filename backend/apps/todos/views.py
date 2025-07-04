from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Case, When, IntegerField
from .models import Todo
from .serializers import TodoSerializer
from backend.apps.users.views import IsAdminUser # Import IsAdminUser


class IsOwnerOrAdmin(permissions.BasePermission):
    """只有任务创建者或管理员可以操作"""
    def has_object_permission(self, request, view, obj):
        # 管理员可以操作所有任务
        if request.user.is_staff:
            return True
        # 创建者可以操作自己的任务
        return obj.created_by == request.user


class TodoViewSet(viewsets.ModelViewSet):
    serializer_class = TodoSerializer
    # IsOwnerOrAdmin handles general object-level permissions (owner or admin)
    # IsAuthenticated ensures user is logged in.
    # Specific admin-only actions will use IsAdminUser decorator.
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    
    def get_queryset(self):
        """获取查询集，支持软删除过滤"""
        user = self.request.user
        
        # 管理员可以看到所有任务（包括已删除的）
        if user.is_staff:
            queryset = Todo.objects.all()
        else:
            # 普通用户只能看到自己的未删除任务
            queryset = Todo.objects.filter(created_by=user, is_deleted=False)
        
        # 过滤参数
        completed = self.request.query_params.get('completed', None)
        search = self.request.query_params.get('search', None)
        show_deleted = self.request.query_params.get('show_deleted', None)
        todo_type = self.request.query_params.get('todo_type', None)  # 新增todo_type过滤
        
        if completed is not None:
            completed_bool = completed.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(completed=completed_bool)
        
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        
        # 新增：根据todo_type过滤
        if todo_type:
            queryset = queryset.filter(todo_type=todo_type)
        
        # 管理员可以查看已删除的任务
        if show_deleted and user.is_staff:
            if show_deleted.lower() in ['true', '1', 'yes']:
                queryset = queryset.filter(is_deleted=True)
            elif show_deleted.lower() in ['false', '0', 'no']:
                queryset = queryset.filter(is_deleted=False)
        
        # 按优先级排序（高优先级靠前），然后按创建时间倒序
        return queryset.annotate(
            priority_order=Case(
                When(priority='high', then=1),
                When(priority='medium', then=2),
                When(priority='low', then=3),
                When(priority='none', then=4),
                default=4,
                output_field=IntegerField()
            )
        ).order_by('priority_order', '-created_at')
    
    def perform_create(self, serializer):
        """创建任务时自动设置创建者"""
        serializer.save(created_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """重写删除方法，使用软删除"""
        todo = self.get_object()
        todo.soft_delete()
        return Response({
            'message': f'任务 "{todo.title}" 已删除',
            'id': todo.id
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def toggle_completed(self, request, pk=None):
        """切换任务完成状态"""
        todo = self.get_object()
        if todo.is_deleted:
            return Response(
                {'error': '已删除的任务无法修改状态'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        todo.completed = not todo.completed
        todo.save()
        serializer = self.get_serializer(todo)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser]) # Use IsAdminUser
    def restore(self, request, pk=None):
        """恢复已删除的任务（仅管理员）"""
        # No need for manual is_staff check, IsAdminUser permission handles it.
        todo = self.get_object()
        if not todo.is_deleted:
            return Response(
                {'error': '任务未被删除，无需恢复'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        todo.restore()
        serializer = self.get_serializer(todo)
        return Response({
            'message': f'任务 "{todo.title}" 已恢复',
            'todo': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def mark_all_completed(self, request):
        """标记所有任务为已完成"""
        user = request.user
        if user.is_staff:
            # 管理员可以标记所有未删除的任务
            queryset = Todo.objects.filter(completed=False, is_deleted=False)
        else:
            # 普通用户只能标记自己的任务
            queryset = Todo.objects.filter(
                created_by=user, completed=False, is_deleted=False
            )
        
        updated_count = queryset.update(completed=True)
        return Response({
            'message': f'已标记 {updated_count} 个任务为完成状态',
            'updated_count': updated_count
        })
    
    @action(detail=False, methods=['delete'])
    def clear_completed(self, request):
        """清除所有已完成的任务（软删除）"""
        user = request.user
        if user.is_staff:
            # 管理员可以清除所有已完成的任务
            queryset = Todo.objects.filter(completed=True, is_deleted=False)
        else:
            # 普通用户只能清除自己的任务
            queryset = Todo.objects.filter(
                created_by=user, completed=True, is_deleted=False
            )
        
        # 使用软删除
        updated_count = queryset.update(is_deleted=True)
        return Response({
            'message': f'已删除 {updated_count} 个已完成任务',
            'deleted_count': updated_count
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser]) # Use IsAdminUser
    def deleted_list(self, request):
        """获取已删除的任务列表（仅管理员）"""
        # No need for manual is_staff check, IsAdminUser permission handles it.
        deleted_todos = Todo.objects.filter(is_deleted=True).order_by('-updated_at')
        serializer = self.get_serializer(deleted_todos, many=True)
        return Response({
            'count': deleted_todos.count(),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser]) # Use IsAdminUser
    def batch_restore(self, request):
        """批量恢复已删除的任务（仅管理员）"""
        # No need for manual is_staff check, IsAdminUser permission handles it.
        todo_ids = request.data.get('todo_ids', [])
        if not todo_ids:
            return Response(
                {'error': '请提供要恢复的任务ID列表'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        restored_count = Todo.objects.filter(
            id__in=todo_ids, is_deleted=True
        ).update(is_deleted=False)
        
        return Response({
            'message': f'已恢复 {restored_count} 个任务',
            'restored_count': restored_count
        })
    
    @action(detail=False, methods=['get'])
    def referenceable_todos(self, request):
        """获取可引用的todo列表（用于AI聊天引用）"""
        user = request.user
        
        # 只返回当前用户创建的未完成且未删除的todo
        todos = Todo.objects.filter(
            created_by=user,
            completed=False,
            is_deleted=False
        ).annotate(
            priority_order=Case(
                When(priority='high', then=1),
                When(priority='medium', then=2),
                When(priority='low', then=3),
                When(priority='none', then=4),
                default=4,
                output_field=IntegerField()
            )
        ).order_by('priority_order', '-created_at')
        
        # 按todo_type分组
        grouped_todos = {
            'record': [],
            'requirement': [],
            'task': [],
            'bug': []
        }
        
        for todo in todos:
            todo_data = {
                'id': todo.id,
                'title': todo.title,
                'description': todo.description,
                'priority': todo.priority,
                'todo_type': todo.todo_type,
                'created_at': todo.created_at
            }
            
            if todo.todo_type in grouped_todos:
                grouped_todos[todo.todo_type].append(todo_data)
        
        return Response({
            'grouped_todos': grouped_todos,
            'total_count': todos.count()
        })
