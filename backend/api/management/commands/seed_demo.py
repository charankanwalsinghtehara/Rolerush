from django.core.management.base import BaseCommand
from api.models import Plan, Job
class Command(BaseCommand):
    help="Seed production-style demo plans and sample jobs"
    def handle(self,*args,**kwargs):
        for name,price,r,i in [("FREE",0,1,1),("PRO",499,5,5),("PREMIUM",999,20,20)]:
            Plan.objects.update_or_create(name=name,defaults={"price":price,"resume_limit":r,"interview_limit":i})
        jobs=[
            ("Generative AI Engineer","AI Labs","Bengaluru, India",True,["Python","LLM","RAG"]),
            ("Machine Learning Engineer","DataWorks","Hyderabad, India",False,["Python","SQL","Machine Learning"]),
            ("Full Stack AI Engineer","BuildAI","Remote",True,["React","Django","PostgreSQL"]),
            ("Data Scientist","Insight Systems","Pune, India",True,["Python","Pandas","SQL"]),
        ]
        for title,company,location,remote,skills in jobs:
            Job.objects.get_or_create(title=title,company=company,defaults={"location":location,"remote":remote,"skills":skills})
        self.stdout.write(self.style.SUCCESS("Demo plans and jobs seeded."))
