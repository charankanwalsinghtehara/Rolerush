from django.db import models
from django.contrib.auth.models import User

class Plan(models.Model):
    name = models.CharField(max_length=50, unique=True)
    price = models.PositiveIntegerField(default=0)
    resume_limit = models.PositiveIntegerField(default=1)
    interview_limit = models.PositiveIntegerField(default=1)
    def __str__(self): return self.name

class Subscription(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

class Usage(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    resumes_used = models.PositiveIntegerField(default=0)
    interviews_used = models.PositiveIntegerField(default=0)

class Resume(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="resumes")
    file = models.FileField(upload_to="resumes/")
    extracted_text = models.TextField(blank=True)
    analysis = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Interview(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="interviews")
    role = models.CharField(max_length=120)
    resume = models.ForeignKey(Resume, null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=30, default="active")
    questions = models.JSONField(default=list, blank=True)
    answers = models.JSONField(default=list, blank=True)
    scorecard = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Job(models.Model):
    title = models.CharField(max_length=160)
    company = models.CharField(max_length=160)
    location = models.CharField(max_length=160, blank=True)
    remote = models.BooleanField(default=False)
    skills = models.JSONField(default=list, blank=True)
    apply_url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    def __str__(self): return f"{self.title} - {self.company}"

class Payment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    order_id = models.CharField(max_length=160, unique=True)
    payment_id = models.CharField(max_length=160, blank=True)
    signature = models.CharField(max_length=300, blank=True)
    status = models.CharField(max_length=30, default="created")
    created_at = models.DateTimeField(auto_now_add=True)


class Application(models.Model):
    STATUS_CHOICES = [
        ("saved","Saved"),("applied","Applied"),("interview","Interview"),
        ("offer","Offer"),("rejected","Rejected")
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="applications")
    job = models.ForeignKey(Job, null=True, blank=True, on_delete=models.SET_NULL)
    company = models.CharField(max_length=160)
    role = models.CharField(max_length=160)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="saved")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class DailyChallenge(models.Model):
    title = models.CharField(max_length=180)
    prompt = models.TextField()
    category = models.CharField(max_length=60, default="career")
    xp = models.PositiveIntegerField(default=25)
    active = models.BooleanField(default=True)
