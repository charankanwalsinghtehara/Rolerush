import os, re, json
from pathlib import Path

ROLE_SKILLS = {
    "Generative AI Engineer": ["Python","LLM","RAG","LangChain","Vector Database","Prompt Engineering","FastAPI"],
    "Machine Learning Engineer": ["Python","Machine Learning","SQL","Pandas","NumPy","Scikit-learn"],
    "Data Scientist": ["Python","SQL","Pandas","NumPy","Statistics","Machine Learning"],
    "Full Stack AI Engineer": ["React","Django","Python","PostgreSQL","Machine Learning","LLM"],
}

def extract_text(upload):
    name = upload.name.lower()
    data = upload.read()
    if name.endswith(".pdf"):
        from PyPDF2 import PdfReader
        import io
        reader = PdfReader(io.BytesIO(data))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    if name.endswith(".docx"):
        from docx import Document
        import io
        doc = Document(io.BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs)
    return data.decode("utf-8", errors="ignore")

def analyze_resume(text, role=""):
    role_skills = ROLE_SKILLS.get(role, sum(ROLE_SKILLS.values(), []))
    found = [s for s in role_skills if re.search(r"\b"+re.escape(s)+r"\b", text, re.I)]
    missing = [s for s in role_skills if s not in found]
    ats = min(100, 35 + len(found)*8)
    overall = min(100, int(ats*0.65 + min(len(text)/50, 35)))
    return {
        "overall_score": overall, "ats_score": ats, "skills_found": found,
        "missing_keywords": missing[:12],
        "strengths": ["Relevant technical stack detected"] if found else ["Resume text extracted successfully"],
        "improvements": [f"Add evidence for {x}" for x in missing[:5]],
        "role_match": role or "General",
    }

def generate_questions(role, resume_text=""):
    skills = ROLE_SKILLS.get(role, ROLE_SKILLS["Generative AI Engineer"])
    return [
        {"type":"technical","question":f"Explain how you would design a production solution for {skills[0]} in a {role} role."},
        {"type":"technical","question":f"Describe a project where you used {skills[1] if len(skills)>1 else 'machine learning'} and explain your trade-offs."},
        {"type":"behavioral","question":"Tell me about a difficult technical problem you solved. What was your approach and result?"},
        {"type":"system_design","question":"How would you monitor, evaluate, and improve an AI system after deployment?"},
        {"type":"behavioral","question":"Why are you a strong fit for this role, and what would you learn in your first 90 days?"},
    ]

def score_answer(answer, question):
    words = len(answer.split())
    relevance = min(100, 35 + words*2)
    structure = 80 if any(x in answer.lower() for x in ["because","result","impact","first","then"]) else 55
    return {"relevance":relevance, "communication":min(100,50+words), "structure":structure}

def final_score(answers):
    if not answers: return {"overall":0}
    scores=[]
    for a in answers: scores.append(a.get("score",{}))
    avg=lambda k: int(sum(x.get(k,0) for x in scores)/len(scores))
    technical=avg("relevance"); communication=avg("communication"); structure=avg("structure")
    overall=int(technical*.45+communication*.30+structure*.25)
    return {"overall":overall,"technical":technical,"communication":communication,"answer_structure":structure,
            "strengths":["Clear attempt to answer the questions","Practical problem-solving orientation"],
            "improvements":["Use measurable outcomes","Use STAR structure for behavioral answers"]}
