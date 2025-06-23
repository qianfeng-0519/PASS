from django.contrib import admin
from .models import Todo


@admin.register(Todo)
class TodoAdmin(admin.ModelAdmin):
    list_display = ['title', 'completed', 'status_display', 'created_at', 'updated_at']
    list_filter = ['completed', 'created_at', 'updated_at']
    search_fields = ['title', 'description']
    list_editable = ['completed']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'description', 'completed')
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()
