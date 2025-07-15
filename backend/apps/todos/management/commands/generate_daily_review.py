import os
import django
from django.core.management.base import BaseCommand
# 修正用户模型导入：使用get_user_model()而不是直接导入User
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
# 修正导入：使用正确的Google GenAI SDK导入方式
import google.genai as genai
from backend.apps.todos.models import Todo
from django.conf import settings

# 获取正确的用户模型
User = get_user_model()

class Command(BaseCommand):
    help = 'Generate daily review for all users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=int,
            help='Generate review for specific user ID only',
        )
        parser.add_argument(
            '--test-mode',
            action='store_true',
            help='Run in test mode with verbose output',
        )
        parser.add_argument(
            '--date',
            type=str,
            help='Specify date in YYYY-MM-DD format (default: today)',
        )

    def handle(self, *args, **options):
        """命令主入口"""
        try:
            # 初始化Gemini客户端
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            
            # 解析目标日期
            if options['date']:
                target_date = datetime.strptime(options['date'], '%Y-%m-%d').date()
            else:
                target_date = timezone.now().date()
            
            start_of_day = timezone.make_aware(datetime.combine(target_date, datetime.min.time()))
            end_of_day = timezone.make_aware(datetime.combine(target_date, datetime.max.time()))
            
            self.stdout.write(f'📅 Processing date: {target_date.strftime("%Y年%m月%d日")}')
            
            # 确定要处理的用户（排除管理员）
            if options['user_id']:
                users = User.objects.filter(id=options['user_id'], is_active=True, is_superuser=False)
                if not users.exists():
                    self.stdout.write(self.style.ERROR(f'❌ User {options["user_id"]} not found, inactive, or is admin'))
                    return
            else:
                users = User.objects.filter(is_active=True, is_superuser=False)  # 排除管理员
            
            self.stdout.write(f'👥 Found {users.count()} active non-admin user(s) to process')
            
            success_count = 0
            error_count = 0
            skip_count = 0
            
            # 为每个用户生成报告
            for user in users:
                try:
                    result = self.generate_user_review(
                        user, client, start_of_day, end_of_day, target_date, options['test_mode']
                    )
                    if result:
                        success_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(f'✅ Generated review for user: {user.username}')
                        )
                    else:
                        # 为无活动用户也生成提醒报告
                        self.generate_inactive_user_reminder(user, target_date, options['test_mode'])
                        skip_count += 1
                        self.stdout.write(
                            self.style.WARNING(f'⏭️  Generated reminder for inactive user: {user.username}')
                        )
                        
                except Exception as e:
                    error_count += 1
                    self.stdout.write(
                        self.style.ERROR(f'❌ Error for user {user.username}: {str(e)}')
                    )
                    if options['test_mode']:
                        import traceback
                        self.stdout.write(traceback.format_exc())
            
            # 输出总结
            self.stdout.write('\n' + '='*60)
            self.stdout.write(f'📊 Task Summary:')
            self.stdout.write(f'   ✅ Success: {success_count}')
            self.stdout.write(f'   ⏭️  Skipped: {skip_count}')
            self.stdout.write(f'   ❌ Errors: {error_count}')
            self.stdout.write(f'   👥 Total users: {users.count()}')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'💥 Fatal error: {str(e)}'))
            if options.get('test_mode'):
                import traceback
                self.stdout.write(traceback.format_exc())
    
    def generate_user_review(self, user, client, start_of_day, end_of_day, target_date, test_mode=False):
        """为指定用户生成每日回顾"""
        # 只获取指定日期新增的todos
        new_todos = Todo.objects.filter(
            created_by=user,
            created_at__range=[start_of_day, end_of_day],
            is_deleted=False
        )
        
        # 只检查新增的todos
        if not new_todos.exists():
            return False
        
        # 构建数据摘要时只传入new_todos
        summary = self.build_todo_summary(new_todos, target_date)
        
        if test_mode:
            self.stdout.write(f'📋 Summary for {user.username}:')
            self.stdout.write(f'   📝 New todos: {summary["new_count"]}')
            self.stdout.write(f'   📊 Type distribution: {summary["type_stats"]}')
        
        # 生成AI报告
        review_content = self.generate_ai_review(client, summary, test_mode)
        
        if test_mode:
            self.stdout.write(f'🤖 AI Review preview: {review_content[:200]}...')
        
        # 直接创建新的报告todo（移除重复检查）
        review_todo = Todo.objects.create(
            created_by=user,
            title=f"每日回顾报告 - {summary['date']}",
            description=review_content,
            todo_type='record',
            priority='medium',
            status='pending'
        )
        
        return True
    
    def generate_inactive_user_reminder(self, user, target_date, test_mode=False):
        """为无活动用户生成提醒报告"""
        date_str = target_date.strftime('%Y年%m月%d日')
        
        reminder_content = f"""📅 **每日回顾报告 - {date_str}**\n\n🔍 **活动概览**\n今日暂无任务活动记录，系统未检测到新增或修改的任务。\n\n💡 **温馨提醒**\n为了更好地管理您的工作和生活，建议您：\n• 每日至少记录1-2个重要任务或想法\n• 定期回顾和更新现有任务状态\n• 利用不同任务类型（记录、需求、任务、故障）来分类管理\n\n🎯 **行动建议**\n明日可以尝试：\n• 记录今日的工作总结或学习心得\n• 规划明日的重要任务和目标\n• 整理待处理的事项和想法\n\n😊 **保持习惯**\n每日使用任务管理系统，让生活更有条理，工作更高效！\n\n*系统自动生成的提醒报告*"""
        
        if test_mode:
            self.stdout.write(f'📝 Reminder for {user.username}: {reminder_content[:100]}...')
        
        # 直接创建新的提醒报告（移除重复检查）
        Todo.objects.create(
            created_by=user,
            title=f"每日回顾报告 - {date_str}",
            description=reminder_content,
            todo_type='record',
            priority='low',
            status='pending'
        )
    
    def build_todo_summary(self, new_todos, target_date):
        """构建todo数据摘要"""
        summary = {
            'date': target_date.strftime('%Y年%m月%d日'),
            'new_count': new_todos.count(),
            'new_todos': [],
            'type_stats': {},
            'priority_stats': {}
        }
        
        # 统计类型分布
        for todo in new_todos:
            todo_type = todo.get_todo_type_display()
            summary['type_stats'][todo_type] = summary['type_stats'].get(todo_type, 0) + 1
        
        # 统计优先级分布
        for todo in new_todos:
            priority = todo.get_priority_display() if todo.priority else '无'
            summary['priority_stats'][priority] = summary['priority_stats'].get(priority, 0) + 1
        
        # 新增todos详情（限制10个）
        for todo in new_todos[:10]:
            summary['new_todos'].append({
                'title': todo.title,
                'type': todo.get_todo_type_display(),
                'description': todo.description[:100] if todo.description else '',
                'priority': todo.get_priority_display() if todo.priority else '无'
            })
        
        return summary
    
    def generate_ai_review(self, client, summary, test_mode=False):
        """生成AI回顾报告"""
        prompt = f"""
你是一个专业的个人效率分析师。请基于以下用户的todo活动数据，生成一份简洁的每日回顾报告（严格控制在300字以内）。

## 📊 数据摘要
日期：{summary['date']}
新增任务：{summary['new_count']}个
任务类型分布：{summary.get('type_stats', {})}
优先级分布：{summary.get('priority_stats', {})}

### 📝 新增任务详情：
{chr(10).join([f"• {todo['title']} ({todo['type']}, {todo['priority']})" for todo in summary['new_todos']]) if summary['new_todos'] else '无'}

## 📋 报告要求
请从以下5个维度进行分析，每个维度2-3句话：
1. **📈 效率评估**：任务创建的效率
2. **🎯 成就亮点**：今日的主要成就和进展
3. **⚠️ 关注问题**：需要注意的问题或风险
4. **💡 改进建议**：明日的具体改进建议
5. **😊 情绪状态**：从任务模式推测的工作状态

请用温暖、专业的语调，提供实用的洞察。严格控制在300字以内，使用emoji让报告更生动。
"""
        
        try:
            if test_mode:
                self.stdout.write('🤖 Calling Gemini API...')
            
            response = client.models.generate_content(
                model="gemini-2.5-pro",
                contents=prompt
            )
            
            # 确保返回的内容有适当的换行格式
            content = response.text
            # 如果AI返回的内容没有足够的换行，我们手动优化格式
            if content.count('\n') < 4:  # 如果换行符少于4个，说明格式可能有问题
                # 在每个维度标题前添加换行
                content = content.replace('**📈', '\n**📈')
                content = content.replace('**🎯', '\n**🎯')
                content = content.replace('**⚠️', '\n**⚠️')
                content = content.replace('**💡', '\n**💡')
                content = content.replace('**😊', '\n**😊')
            
            return content
            
        except Exception as e:
            error_msg = f"AI报告生成失败：{str(e)}"
            if test_mode:
                self.stdout.write(self.style.ERROR(f'🤖 AI Error: {error_msg}'))
            
            # 返回格式化的默认报告
            return f"""📊 **每日回顾报告 - {summary['date']}**\n\n📈 **效率评估**\n今日新增{summary['new_count']}个任务，修改{summary['modified_count']}个任务。任务处理节奏{'较为活跃' if summary['new_count'] + summary['modified_count'] > 5 else '相对平稳'}。\n\n🎯 **成就亮点**\n{'完成了多项任务的创建和更新，保持了良好的任务管理习惯' if summary['new_count'] > 0 else '专注于现有任务的优化和调整'}。\n\n⚠️ **关注问题**\n{'任务数量较多，注意合理安排优先级' if summary['new_count'] > 10 else '建议保持当前的工作节奏'}。\n\n💡 **改进建议**\n明日可以关注任务的完成情况，适当调整工作重点。\n\n😊 **情绪状态**\n从任务管理模式看，工作状态积极主动，建议保持。\n\n*注：AI分析服务暂时不可用，以上为基础分析报告。*"""