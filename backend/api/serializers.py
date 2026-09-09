from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Resume, Interview, Job, Plan, Subscription, Usage, Payment

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ("username","email","password")
    def create(self, data):
        return User.objects.create_user(**data)

class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ("id","file","analysis","created_at")

class InterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = ("id","role","status","questions","answers","scorecard","created_at")

class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = "__all__"

class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = "__all__"

class UsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usage
        fields = "__all__"
