# Generated by Django 5.1.5 on 2025-01-28 20:38

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0006_temporaryfilelink_generated_by'),
    ]

    operations = [
        migrations.RenameField(
            model_name='temporaryfilelink',
            old_name='file',
            new_name='file_name',
        ),
    ]
