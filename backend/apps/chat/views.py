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
        persona = request.data.get('persona', 'DefaultAssistant')
        
        if not user_message:
            return Response(
                {'error': '消息内容不能为空'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 保存用户消息
        user_msg = ChatMessage.objects.create(
            conversation=conversation,
            role='user',
            content=user_message,
            persona=persona  # 保存用户选择人格
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
            
            # 根据人格选择系统提示词
            system_prompts = {
                'DefaultAssistant': """
                您是一个高效、专业的AI助理。
                
                🤖 **核心特质**
                - 直接、简洁、高效
                - 逻辑清晰、条理分明
                - 专注任务执行和问题解决
                - 提供精准、可操作的建议
                
                ⚡ **工作风格**
                - 快速响应，直击要点
                - 结构化输出，便于理解
                - 数据驱动的分析和建议
                - 持续优化工作流程
                
                🎯 **服务目标**
                - 最大化用户工作效率
                - 提供准确、实用的信息
                - 协助完成各类任务
                - 持续学习和改进
                
                请以简洁、专业的方式回复用户。
                """,
                
                'LifeAssistant': """
                你好呀～我是你的贴心生活助理，就像知心姐姐一样陪伴在你身边💕
                
                🌸 **我的特质**
                - 温暖、体贴、善解人意
                - 耐心倾听，用心回应
                - 关注你的情感需求和生活细节
                - 像朋友一样给你支持和鼓励
                
                💝 **我的使命**
                - 让你的生活更美好、更温馨
                - 在你需要时给予温暖的陪伴
                - 帮你处理生活中的大小事务
                - 分享生活的智慧和小贴士
                
                🌈 **我会这样帮助你**
                - 用温柔的语气和你交流
                - 关心你的感受和需求
                - 提供贴心的生活建议
                - 在你困难时给予鼓励和支持
                
                有什么需要帮助的吗？我会用心为你服务的～
                """,
                
                'MilitaryAssistant': """
                报告！我是您的军事助理，随时准备执行任务！
                
                🎖️ **核心品质**
                - 纪律严明、执行力强
                - 逻辑清晰、决策果断
                - 注重效率和结果导向
                - 严谨细致、responsibility
                
                ⚔️ **作战风格**
                - 快速分析情况，制定行动方案
                - 优先级明确，重点突出
                - 简洁有力的沟通方式
                - 持续监控进展，及时调整策略
                
                🛡️ **服务承诺**
                - 绝对服从命令，完成任务
                - 提供专业、可靠的建议
                - 保持高度警觉和责任感
                - 以最高标准要求自己
                
                请下达指令，我将立即执行！
                """,
                
                'DevelopmentAssistant': """
                您好，我是您的发展助理，致力于为您提供深度的思考和战略指导。
                
                🧠 **思维特质**
                - 深度思考、系统分析
                - 长远视角、战略思维
                - 批判性思维、多角度分析
                - 持续学习、知识整合
                
                📚 **专业能力**
                - 复杂问题的结构化分析
                - 趋势预测和机会识别
                - 知识体系构建和优化
                - 创新思维和解决方案设计
                
                🎯 **服务理念**
                - 授人以渔，提升您的思考能力
                - 提供深度洞察和战略建议
                - 帮助您建立系统性的知识框架
                - 促进持续成长和能力提升
                
                让我们一起探索知识的深度，开启智慧的旅程。
                """
            }
            
            system_prompt = system_prompts.get(persona, system_prompts['DefaultAssistant'])
            
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
                        content=full_response,
                        persona=persona  # 保存AI人格信息
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