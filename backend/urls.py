"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from backend.apps.todos import views as todo_views
from backend.apps.chat import views as chat_views
from backend.apps.todos.views import TodoViewSet, QuickTaskConfigViewSet

# API Router
router = DefaultRouter()
router.register(r'todos', todo_views.TodoViewSet, basename='todo')
router.register(r'chat', chat_views.ChatViewSet, basename='chat')  # 新增chat路由
router.register(r'quick-task-configs', QuickTaskConfigViewSet, basename='quicktaskconfig')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/', include('backend.apps.users.urls')),
    path('api-auth/', include('rest_framework.urls')),
]
