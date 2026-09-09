from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies=[("api","0001_initial")]
    operations=[
        migrations.CreateModel(
            name="Application",
            fields=[
                ("id",models.BigAutoField(auto_created=True,primary_key=True,serialize=False,verbose_name="ID")),
                ("company",models.CharField(max_length=160)),
                ("role",models.CharField(max_length=160)),
                ("status",models.CharField(choices=[("saved","Saved"),("applied","Applied"),("interview","Interview"),("offer","Offer"),("rejected","Rejected")],default="saved",max_length=30)),
                ("notes",models.TextField(blank=True)),
                ("created_at",models.DateTimeField(auto_now_add=True)),
                ("updated_at",models.DateTimeField(auto_now=True)),
                ("job",models.ForeignKey(blank=True,null=True,on_delete=django.db.models.deletion.SET_NULL,to="api.job")),
                ("user",models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,related_name="applications",to="auth.user")),
            ],
        ),
        migrations.CreateModel(
            name="DailyChallenge",
            fields=[
                ("id",models.BigAutoField(auto_created=True,primary_key=True,serialize=False,verbose_name="ID")),
                ("title",models.CharField(max_length=180)),
                ("prompt",models.TextField()),
                ("category",models.CharField(default="career",max_length=60)),
                ("xp",models.PositiveIntegerField(default=25)),
                ("active",models.BooleanField(default=True)),
            ],
        ),
    ]
