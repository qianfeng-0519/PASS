from django.contrib import admin
from .models import Todo, QuickTaskConfig

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

@admin.register(QuickTaskConfig)
class QuickTaskConfigAdmin(admin.ModelAdmin):
    list_display = ['name', 'todo_type', 'priority', 'created_by', 'is_active', 'created_at']
    list_filter = ['todo_type', 'priority', 'is_active', 'created_at']
    search_fields = ['name', 'title', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('基本信息', {
            'fields': ('name', 'title', 'description')
        }),
        ('任务配置', {
            'fields': ('todo_type', 'priority')
        }),
        ('状态', {
            'fields': ('is_active',)
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # 新建时
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
