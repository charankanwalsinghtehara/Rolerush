import os, hmac, hashlib, razorpay
from django.contrib.auth.models import User
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import *
from .serializers import *
from .services import *

def get_usage(user):
    usage, _ = Usage.objects.get_or_create(user=user)
    sub = Subscription.objects.filter(user=user).select_related("plan").first()
    if not sub:
        plan, _ = Plan.objects.get_or_create(name="FREE", defaults={"price":0,"resume_limit":1,"interview_limit":1})
        sub = Subscription.objects.create(user=user, plan=plan)
    return usage, sub

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register(request):
    ser=RegisterSerializer(data=request.data); ser.is_valid(raise_exception=True); user=ser.save()
    usage, sub=get_usage(user)
    refresh=RefreshToken.for_user(user)
    return Response({"access":str(refresh.access_token),"refresh":str(refresh),"user":user.username})

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login(request):
    from django.contrib.auth import authenticate
    user=authenticate(username=request.data.get("username"), password=request.data.get("password"))
    if not user: return Response({"detail":"Invalid credentials"},status=400)
    refresh=RefreshToken.for_user(user)
    return Response({"access":str(refresh.access_token),"refresh":str(refresh),"user":user.username})

@api_view(["GET"])
def me(request):
    usage, sub=get_usage(request.user)
    return Response({"username":request.user.username,"plan":sub.plan.name,"resumes_used":usage.resumes_used,
                     "resume_limit":sub.plan.resume_limit,"interviews_used":usage.interviews_used,
                     "interview_limit":sub.plan.interview_limit})

@api_view(["POST"])
@parser_classes([MultiPartParser,FormParser])
def upload_resume(request):
    usage, sub=get_usage(request.user)
    if usage.resumes_used >= sub.plan.resume_limit:
        return Response({"detail":"Resume upload limit reached. Upgrade your plan."},status=402)
    f=request.FILES.get("file")
    if not f: return Response({"detail":"file is required"},status=400)
    allowed={".pdf",".docx",".txt"}
    ext=os.path.splitext(f.name)[1].lower()
    if ext not in allowed: return Response({"detail":"Only PDF, DOCX and TXT files are supported."},status=400)
    if f.size > 10*1024*1024: return Response({"detail":"File must be 10 MB or smaller."},status=400)
    text=extract_text(f)
    role=request.data.get("role","")
    analysis=analyze_resume(text,role)
    r=Resume.objects.create(user=request.user,file=f,extracted_text=text,analysis=analysis)
    usage.resumes_used+=1; usage.save()
    return Response(ResumeSerializer(r).data,status=201)

@api_view(["POST"])
def start_interview(request):
    usage, sub=get_usage(request.user)
    if usage.interviews_used >= sub.plan.interview_limit:
        return Response({"detail":"Interview limit reached. Upgrade your plan."},status=402)
    role=request.data.get("role","Generative AI Engineer")
    resume=Resume.objects.filter(user=request.user).order_by("-created_at").first()
    qs=generate_questions(role,resume.extracted_text if resume else "")
    interview=Interview.objects.create(user=request.user,role=role,resume=resume,questions=qs)
    usage.interviews_used+=1; usage.save()
    return Response(InterviewSerializer(interview).data,status=201)

@api_view(["POST"])
def answer_interview(request, pk):
    try: interview=Interview.objects.get(pk=pk,user=request.user)
    except Interview.DoesNotExist: return Response({"detail":"Not found"},status=404)
    answer=request.data.get("answer","").strip()
    idx=int(request.data.get("question_index",len(interview.answers)))
    q=interview.questions[idx]["question"] if idx < len(interview.questions) else ""
    result={"question_index":idx,"answer":answer,"score":score_answer(answer,q)}
    answers=interview.answers+[result]; interview.answers=answers; interview.save()
    return Response(result)

@api_view(["POST"])
@parser_classes([MultiPartParser,FormParser])
def audio_answer(request, pk):
    try: interview=Interview.objects.get(pk=pk,user=request.user)
    except Interview.DoesNotExist: return Response({"detail":"Not found"},status=404)
    # Store an audio file in production and pass it through a speech-to-text provider.
    return Response({"status":"received","transcript":"Audio received. Connect your preferred STT provider here."})

@api_view(["POST"])
def finish_interview(request, pk):
    try: interview=Interview.objects.get(pk=pk,user=request.user)
    except Interview.DoesNotExist: return Response({"detail":"Not found"},status=404)
    interview.scorecard=final_score(interview.answers); interview.status="completed"; interview.save()
    return Response(interview.scorecard)

@api_view(["GET"])
def jobs(request):
    role=request.GET.get("role","")
    qs=Job.objects.all()
    if role: qs=qs.filter(title__icontains=role.split()[0])
    return Response(JobSerializer(qs[:30],many=True).data)

@api_view(["GET"])
def plans(request):
    plans=Plan.objects.all()
    if not plans.exists():
        for name,price,r,i in [("FREE",0,1,1),("PRO",499,5,5),("PREMIUM",999,20,20)]:
            Plan.objects.create(name=name,price=price,resume_limit=r,interview_limit=i)
        plans=Plan.objects.all()
    return Response(PlanSerializer(plans,many=True).data)

@api_view(["POST"])
def create_payment_order(request):
    plan=Plan.objects.get(id=request.data["plan_id"])
    key=os.getenv("RAZORPAY_KEY_ID"); secret=os.getenv("RAZORPAY_KEY_SECRET")
    if not key or not secret: return Response({"detail":"Configure Razorpay keys first."},status=503)
    client=razorpay.Client(auth=(key,secret))
    order=client.order.create({"amount":plan.price*100,"currency":"INR","payment_capture":1})
    Payment.objects.create(user=request.user,plan=plan,order_id=order["id"])
    return Response({"key_id":key,"order":order})

@api_view(["POST"])
def verify_payment(request):
    key=os.getenv("RAZORPAY_KEY_ID"); secret=os.getenv("RAZORPAY_KEY_SECRET")
    if not secret: return Response({"detail":"Configure Razorpay first."},status=503)
    order_id=request.data["razorpay_order_id"]; payment_id=request.data["razorpay_payment_id"]; sig=request.data["razorpay_signature"]
    expected=hmac.new(secret.encode(),f"{order_id}|{payment_id}".encode(),hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected,sig): return Response({"detail":"Invalid signature"},status=400)
    p=Payment.objects.get(order_id=order_id,user=request.user); p.payment_id=payment_id;p.signature=sig;p.status="paid";p.save()
    Subscription.objects.update_or_create(user=request.user,defaults={"plan":p.plan})
    return Response({"status":"paid","plan":p.plan.name})


@api_view(["POST"])
def analyze_jd(request):
    jd=request.data.get("job_description","").strip()
    if not jd: return Response({"detail":"job_description is required"},status=400)
    resume=Resume.objects.filter(user=request.user).order_by("-created_at").first()
    text=resume.extracted_text if resume else ""
    role=request.data.get("role","")
    analysis=analyze_resume(text,role)
    jd_words=set(re.findall(r"[A-Za-z][A-Za-z0-9+#.-]{2,}",jd.lower()))
    resume_words=set(re.findall(r"[A-Za-z][A-Za-z0-9+#.-]{2,}",text.lower()))
    overlap=sorted(list(jd_words & resume_words))[:25]
    gaps=sorted(list(jd_words-resume_words))[:15]
    match=min(100,45+len(overlap)*3)
    return Response({"match_score":match,"matched_keywords":overlap,"missing_keywords":gaps,
                     "recommendation":"Strong match" if match>=75 else "Good potential — close the priority skill gaps",
                     "target_role":role or "Detected from job description"})

@api_view(["POST"])
def generate_cover_letter(request):
    role=request.data.get("role","")
    company=request.data.get("company","")
    resume=Resume.objects.filter(user=request.user).order_by("-created_at").first()
    skills=(resume.analysis.get("skills_found",[]) if resume else [])[:6]
    letter=f"""Dear Hiring Team,

I’m excited to apply for the {role or "position"} at {company or "your company"}.

My background combines practical engineering skills with an AI-first mindset. I have hands-on experience with {", ".join(skills) if skills else "software development, data and machine learning"}, and I enjoy turning technical ideas into useful products.

I’d welcome the opportunity to bring that problem-solving approach to your team and contribute from day one.

Best regards,
{request.user.get_full_name() or request.user.username}"""
    return Response({"cover_letter":letter})

@api_view(["GET"])
def career_stats(request):
    usage,sub=get_usage(request.user)
    resumes=list(Resume.objects.filter(user=request.user).order_by("-created_at")[:5])
    interviews=list(Interview.objects.filter(user=request.user).order_by("-created_at")[:10])
    completed=[x.scorecard.get("overall",0) for x in interviews if x.status=="completed" and x.scorecard]
    latest=completed[0] if completed else 0
    avg=int(sum(completed)/len(completed)) if completed else 0
    return Response({"xp":min(5000,usage.resumes_used*100+usage.interviews_used*150+len(completed)*75),
                     "streak":max(1,min(12,usage.interviews_used+usage.resumes_used)),
                     "latest_score":latest,"average_interview_score":avg,
                     "resume_count":Resume.objects.filter(user=request.user).count(),
                     "application_count":Application.objects.filter(user=request.user).count(),
                     "plan":sub.plan.name})

@api_view(["GET"])
def challenges(request):
    qs=DailyChallenge.objects.filter(active=True).order_by("id")
    if not qs.exists():
        defaults=[
            ("Fix one resume bullet","Rewrite one bullet using action + impact + metric.","resume",30),
            ("60-second pitch","Record or write a 60-second answer to: Tell me about yourself.","interview",40),
            ("Skill sprint","Pick one missing keyword from your target role and learn the basics.","skills",35),
        ]
        for title,prompt,cat,xp in defaults:
            DailyChallenge.objects.create(title=title,prompt=prompt,category=cat,xp=xp)
        qs=DailyChallenge.objects.filter(active=True)
    return Response([{"id":x.id,"title":x.title,"prompt":x.prompt,"category":x.category,"xp":x.xp} for x in qs[:5]])

@api_view(["GET","POST"])
def applications(request):
    if request.method=="GET":
        qs=Application.objects.filter(user=request.user).select_related("job").order_by("-updated_at")
        return Response([{"id":x.id,"company":x.company,"role":x.role,"status":x.status,"notes":x.notes,
                          "job_id":x.job_id} for x in qs])
    data=request.data
    job=Job.objects.filter(id=data.get("job_id")).first() if data.get("job_id") else None
    a=Application.objects.create(user=request.user,job=job,company=data.get("company") or (job.company if job else ""),
                                 role=data.get("role") or (job.title if job else ""),status=data.get("status","saved"),
                                 notes=data.get("notes",""))
    return Response({"id":a.id,"status":a.status},status=201)


@api_view(["POST"])
def voice_answer(request, pk):
    """Accept a transcript produced by the selected STT layer.

    The browser voice mode currently uses Web Speech API for STT. Keeping the
    transcript endpoint server-side means a paid/provider STT service can replace
    browser STT later without changing scoring or interview storage.
    """
    try:
        interview = Interview.objects.get(pk=pk, user=request.user)
    except Interview.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

    transcript = (request.data.get("transcript") or "").strip()
    if not transcript:
        return Response({"detail": "Transcript is required"}, status=400)

    idx = int(request.data.get("question_index", len(interview.answers)))
    if idx >= len(interview.questions):
        return Response({"detail": "Question index is out of range"}, status=400)

    question = interview.questions[idx]["question"]
    result = {
        "question_index": idx,
        "answer": transcript,
        "score": score_answer(transcript, question),
        "input_mode": "voice",
    }
    interview.answers = interview.answers + [result]
    interview.save(update_fields=["answers"])
    return Response(result)
