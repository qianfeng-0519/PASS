from django.apps import AppConfig
import os
import logging

logger = logging.getLogger(__name__)

class SchedulerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.apps.scheduler'
    verbose_name = '定时任务调度器'
    
    def ready(self):
        print(f"[DEBUG] SchedulerConfig.ready() 被调用，RUN_MAIN={os.environ.get('RUN_MAIN')}")
        # 只在主进程中启动调度器，避免在Django重载时重复启动
        if os.environ.get('RUN_MAIN') == 'true':
            print("[SCHEDULER] 准备启动定时任务调度器...")
            self.start_scheduler()
        else:
            print("[SCHEDULER] 跳过调度器启动（非主进程）")
    
    def start_scheduler(self):
        from apscheduler.schedulers.background import BackgroundScheduler
        from apscheduler.triggers.cron import CronTrigger
        from django.core.management import call_command
        import atexit
        
        try:
            scheduler = BackgroundScheduler()
            
            def run_daily_review():
                try:
                    print("[SCHEDULER] 🚀 开始执行每日回顾生成任务")
                    logger.info("开始执行每日回顾生成任务")
                    call_command('generate_daily_review')
                    print("[SCHEDULER] ✅ 每日回顾生成任务执行完成")
                    logger.info("每日回顾生成任务执行完成")
                except Exception as e:
                    print(f"[SCHEDULER] ❌ 每日回顾生成任务执行失败: {e}")
                    logger.error(f"每日回顾生成任务执行失败: {e}")
            
            # 添加定时任务：每天23点执行
            scheduler.add_job(
                run_daily_review,
                CronTrigger(hour=23, minute=0),
                id='daily_review_job',
                name='生成每日回顾报告',
                replace_existing=True
            )
            
            scheduler.start()
            print("[SCHEDULER] ✅ 定时任务调度器已成功启动！")
            print(f"[SCHEDULER] 📅 每日任务：每天23:00执行")
            logger.info("定时任务调度器已启动")
            
            # 确保Django关闭时停止调度器
            atexit.register(lambda: scheduler.shutdown())
            
        except Exception as e:
            print(f"[SCHEDULER] ❌ 调度器启动失败: {e}")
            logger.error(f"调度器启动失败: {e}")