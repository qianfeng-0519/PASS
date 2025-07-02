from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import StreamingHttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import json
import os
from openai import OpenAI
from .models import ChatConversation, ChatMessage
from .serializers import (
    ChatConversationSerializer, 
    ChatConversationListSerializer,
    ChatMessageSerializer
)

class ChatViewSet(viewsets.ModelViewSet):
    """聊天对话视图集"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """只返回当前用户的对话"""
        return ChatConversation.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """根据动作选择序列化器"""
        if self.action == 'list':
            return ChatConversationListSerializer
        return ChatConversationSerializer
    
    def perform_create(self, serializer):
        """创建对话时自动设置用户"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """发送消息并获取AI回复"""
        conversation = self.get_object()
        user_message = request.data.get('message', '').strip()
        
        if not user_message:
            return Response(
                {'error': '消息内容不能为空'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 保存用户消息
        user_msg = ChatMessage.objects.create(
            conversation=conversation,
            role='user',
            content=user_message
        )
        
        # 更新对话标题（如果是第一条消息）
        if conversation.title == '新对话' and conversation.messages.count() == 1:
            conversation.title = user_message[:50] + ('...' if len(user_message) > 50 else '')
            conversation.save()
        
        # 调用火山引擎API
        try:
            client = OpenAI(
                base_url="https://ark.cn-beijing.volces.com/api/v3",
                api_key="3876a9bd-7ef2-43ed-95bf-ef4b591dc7ce"
            )
            
            # 构建对话历史
            messages = []
            
            # 星舰AI助理系统提示词
            system_prompt = """
            您好，舰长。我是您的星舰AI助理系统。
            
            🛸 **核心职能**
            - 信息处理与分析
            - 任务规划与执行监控
            - 故障诊断与应急响应
            - 舰队运营数据管理
            
            ⚡ **操作规范**
            - 简洁、准确的中文回复
            - 优先级导向的信息呈现
            - 实时状态监控与预警
            - 高效的决策支持
            
            🎯 **服务范围**
            - 舰船系统状态查询
            - 任务分配与进度跟踪
            - 故障记录与维修建议
            - 资源配置优化方案
            - 航行路径与风险评估
            
            随时为您提供专业支持，舰长。
            """
            
            messages.append({
                "role": "system",
                "content": system_prompt.strip()
            })
            
            # 添加对话历史
            for msg in conversation.messages.all():
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
            
            # 流式响应
            def generate_response():
                try:
                    stream = client.chat.completions.create(
                        model="doubao-seed-1-6-250615",
                        messages=messages,
                        stream=True
                    )
                    
                    full_response = ""
                    for chunk in stream:
                        if chunk.choices[0].delta.content:
                            content = chunk.choices[0].delta.content
                            full_response += content
                            yield f"data: {json.dumps({'content': content, 'type': 'chunk'})}\n\n"
                    
                    # 保存AI回复
                    ai_msg = ChatMessage.objects.create(
                        conversation=conversation,
                        role='assistant',
                        content=full_response
                    )
                    
                    yield f"data: {json.dumps({'type': 'done', 'message_id': ai_msg.id})}\n\n"
                    
                except Exception as e:
                    yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
            
            response = StreamingHttpResponse(
                generate_response(),
                content_type='text/event-stream'
            )
            response['Cache-Control'] = 'no-cache'
            response['Access-Control-Allow-Origin'] = '*'
            response['X-Accel-Buffering'] = 'no'  # 可选：禁用nginx缓冲
            return response
            
        except Exception as e:
            return Response(
                {'error': f'AI服务调用失败: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """获取对话的所有消息"""
        conversation = self.get_object()
        messages = conversation.messages.all()
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def create_conversation(self, request):
        """创建新对话"""
        conversation = ChatConversation.objects.create(
            user=request.user,
            title='新对话'
        )
        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)