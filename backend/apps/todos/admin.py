from django.contrib import admin
from .models import Todo

@admin.register(Todo)
class TodoAdmin(admin.ModelAdmin):
    list_display = ['title', 'todo_type', 'completed', 'status_display', 'created_at', 'updated_at']
    list_filter = ['completed', 'todo_type', 'created_at', 'updated_at']  # 添加类型过滤
    search_fields = ['title', 'description']
    list_editable = ['completed', 'todo_type']  # 添加类型可编辑
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'description', 'todo_type', 'completed')  # 添加类型字段
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def status_display(self, obj):
        return obj.status_display
    status_display.short_description = '状态'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()
