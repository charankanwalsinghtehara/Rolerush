from django.urls import path
from .views import *
urlpatterns=[
path("auth/register/",register),path("auth/login/",login),path("me/",me),
path("resumes/",upload_resume),path("interviews/start/",start_interview),
path("interviews/<int:pk>/answer/",answer_interview),path("interviews/<int:pk>/voice/",voice_answer),path("interviews/<int:pk>/audio/",audio_answer),
path("interviews/<int:pk>/finish/",finish_interview),path("jobs/",jobs),path("plans/",plans),
path("payments/create-order/",create_payment_order),path("payments/verify/",verify_payment),
path("jd/analyze/",analyze_jd),path("cover-letter/",generate_cover_letter),
path("career/stats/",career_stats),path("challenges/",challenges),path("applications/",applications),
]
