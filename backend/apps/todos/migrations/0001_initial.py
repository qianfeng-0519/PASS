# Generated by Django 5.0.1 on 2025-06-20 09:18

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Todo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(help_text='任务标题', max_length=200)),
                ('description', models.TextField(blank=True, help_text='任务描述')),
                ('completed', models.BooleanField(default=False, help_text='是否完成')),
                ('is_deleted', models.BooleanField(default=False, help_text='软删除标记', verbose_name='删除标记')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='更新时间')),
                ('created_by', models.ForeignKey(default=1, help_text='任务创建者', on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='创建人')),
            ],
            options={
                'verbose_name': '待办事项',
                'verbose_name_plural': '待办事项',
                'ordering': ['-created_at'],
                'indexes': [models.Index(fields=['created_by'], name='todos_todo_created_8629c2_idx'), models.Index(fields=['is_deleted'], name='todos_todo_is_dele_da92a2_idx')],
            },
        ),
    ]
