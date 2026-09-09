from django.contrib import admin
from .models import Plan, Subscription, Usage, Resume, Interview, Job, Payment
admin.site.register([Plan, Subscription, Usage, Resume, Interview, Job, Payment])
