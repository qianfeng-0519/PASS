from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # 用户认证相关
    path('register/', views.register, name='user-register'),
    path('login/', views.login, name='user-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('change-password/', views.change_password, name='change-password'),
    
    # 管理员用户管理相关
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:pk>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<int:user_id>/toggle-status/', views.admin_toggle_user_status, name='admin-toggle-user-status'),
    path('admin/users/<int:user_id>/delete/', views.admin_delete_user, name='admin-delete-user'),
    path('admin/users/<int:user_id>/reset-password/', views.admin_reset_password, name='admin-reset-password'),
    path('admin/users/<int:user_id>/update-role/', views.admin_update_role, name='admin-update-role'),
    path('admin/stats/', views.admin_user_stats, name='admin-user-stats'),
]