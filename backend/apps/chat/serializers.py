from rest_framework import serializers
from .models import ChatConversation, ChatMessage

class ChatMessageSerializer(serializers.ModelSerializer):
    """聊天消息序列化器"""
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'created_at']
        read_only_fields = ['id', 'created_at']

class ChatConversationSerializer(serializers.ModelSerializer):
    """聊天对话序列化器"""
    messages = ChatMessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()
    last_message_time = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatConversation
        fields = [
            'id', 'title', 'created_at', 'updated_at', 
            'messages', 'message_count', 'last_message_time'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_message_count(self, obj):
        return obj.messages.count()
    
    def get_last_message_time(self, obj):
        last_message = obj.messages.last()
        return last_message.created_at if last_message else obj.created_at

class ChatConversationListSerializer(serializers.ModelSerializer):
    """聊天对话列表序列化器（简化版）"""
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    display_title = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatConversation
        fields = [
            'id', 'title', 'display_title', 'created_at', 
            'updated_at', 'message_count', 'last_message'
        ]
    
    def get_message_count(self, obj):
        return obj.messages.count()
    
    def get_last_message(self, obj):
        last_message = obj.messages.last()
        if last_message:
            return {
                'content': last_message.content[:100] + ('...' if len(last_message.content) > 100 else ''),
                'role': last_message.role,
                'created_at': last_message.created_at
            }
        return None
    
    def get_display_title(self, obj):
        if obj.title == '新对话':
            return obj.get_first_user_message()
        return obj.title