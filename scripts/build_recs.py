import json,re
r=json.load(open('recs_raw.json'))
FIX={
4:("I","C","Counselling on healthy lifestyle choices including maintaining a healthy weight, consuming a well-balanced diet, avoiding sedentary behaviour, abstaining from smoking and heavy alcohol consumption as well as counselling against the use of drugs such as cocaine, amphetamines, and anabolic steroids is recommended for all patients with stage A or B HF to reduce the risk of HF progression.",1),
5:("IIa","A","Treatment with a statin should be considered in people at high risk of, or with established ASCVD, to reduce the risk of HF.",1),
10:("I","C","In patients with suspected HF, the following laboratory tests are recommended when screening for comorbidities: full blood count, kidney function (eGFR and UACR), electrolytes, liver function, thyroid function, HbA1c, lipids, and iron status (TSAT and ferritin).",3),
11:("I","C","Natriuretic peptide measurement is recommended in patients with suspected HF (interpreted in relation to patient age, obesity, and other factors known to affect natriuretic peptide level).",3),
12:("I","C","A 12-lead ECG is recommended in patients with suspected HF.",3),
13:("I","C","Chest radiography (X-ray) is recommended in patients with suspected HF.",3),
14:("I","C","Transthoracic echocardiogram is recommended in patients with suspected HF to confirm the diagnosis, differentiate between HF phenotypes and aid in identifying the underlying aetiology of HF.",3),
36:(None,None,"A cardiac glycoside (digoxin or digitoxin) should be considered in patients with symptomatic HFrEF with LVEF ≤40%, despite optimal FMT, to reduce the risk of HFH.",5),
44:("I","A","An ICD is recommended in patients who have recovered from a ventricular arrhythmia causing haemodynamic instability (secondary prevention), and who are expected to survive for >1 year with good functional status, in the absence of reversible causes, or unless the ventricular arrhythmia has occurred <48 h after an MI, to reduce the risk of sudden death and all-cause death.",6),
45:(None,None,"An ICD is recommended in patients with symptomatic HFrEF (NYHA class II/III) of an ischaemic aetiology (unless they have had an MI in the prior 40 days), and an LVEF ≤35% despite ≥3 months of optimal FMT, provided they are expected to survive longer than 1 year with good functional status, to reduce the risk of sudden death and all-cause death.",6),
46:(None,None,"An ICD should be considered in patients with symptomatic HFrEF (NYHA class II/III) of a non-ischaemic aetiology, and an LVEF ≤35% despite ≥3 months of optimal FMT, provided they are expected to survive longer than 1 year with good functional status, to reduce the risk of sudden death and all-cause death.",6),
57:(None,None,"Initiation of FMT and planning for CRT implantation may be considered simultaneously in patients with symptomatic HFrEF, an LBBB with QRS ≥150 ms, and LVEF ≤35%, to improve symptoms and reduce morbidity and death, although reassessment of LVEF should be conducted prior to CRT implantation.",7),
58:(None,None,"CRT is not recommended in patients with a QRS duration <130 ms who do not have an indication for pacing due to high-degree AV block.",7),
62:(None,None,"Intubation is recommended in patients with DHF and persistent and progressive respiratory failure despite oxygen administration or non-invasive ventilation to correct hypoxaemia.",9),
63:(None,None,"Non-invasive positive pressure ventilation should be considered in patients with respiratory distress (respiratory rate >25 breaths/min, SpO2 <90%) and started as soon as possible in order to decrease respiratory distress and reduce the risk of endotracheal intubation.",9),
61:(None,None,"Oxygen is recommended in patients with SpO2 <90% or PaO2 <60 mmHg to correct hypoxaemia.",9),
85:("I","C","Durable MCS (LVAD) is recommended in selected patients with advanced HFrEF, despite FMT and GDIT, as BTT, BTC, BTR, or as destination therapy to improve symptoms and reduce the risk of death.",13),
86:("IIa","C","Histopathological examination of explanted heart tissue from LVAD or heart transplantation surgery should be considered in patients with non-ischaemic HF to identify an aetiological diagnosis that may be treatable or facilitate family screening.",13),
90:(None,None,"Beta-blockers are recommended in stable patients with HFrEF and AF as first-line therapy for short- and long-term rate control.",15),
91:(None,None,"Digoxin should be considered in stable patients with HFrEF and AF when the ventricular rate remains high despite beta-blockers, or when beta-blockers are contraindicated/not tolerated, in order to obtain short- and long-term rate control.",15),
100:(None,None,"Mitral transcatheter edge-to-edge repair may be considered in selected symptomatic patients with HFrEF and persistent severe secondary mitral regurgitation despite optimized FMT and CRT if indicated (after excluding the option of LVAD or heart transplantation) who do not fulfil the specific clinical and echocardiographic criteria, in order to reduce the risk of HFH and improve QoL.",17),
105:(None,None,"Adaptive servo-ventilation may be considered in patients with HFrEF and sleep-disordered breathing with predominant obstructive sleep apnoea to improve sleep quality, health-related QoL and symptoms.",20),
106:(None,None,"Adaptive servo-ventilation is not recommended in patients with HFrEF and sleep-disordered breathing with predominant central sleep apnoea because of an increased risk of CV and all-cause death.",20),
107:("IIa","C","Assessment of anxiety, depression and frailty should be considered in patients with HF to support the development of personalized care plans and to identify factors that may contribute to adverse outcomes.",21),
110:("I","B1","A multidisciplinary HF management programme is recommended in patients with HF to reduce the risk of HFH and death.",23),
111:("I","A","HF education and self-management strategies in patients with HF are recommended to reduce the risk of HFH or death.",23),
112:("I","B2","Multidisciplinary interventions to improve adherence, including assessment of health literacy and polypharmacy review, are recommended in patients with HF to reduce the risk of hospitalization and death.",23),
115:("I","B1","Cardiac rehabilitation is recommended in patients with an LVAD to improve functional capacity and QoL.",24),
}
out=[]
def clean(t):
    t=re.sub(r'(\s+[b-e])?(\s+\d[\d,–\s]*)+$','',t.strip())
    t=re.sub(r'(?<=[a-z\)])\.\s?[b-e]$','.',t)
    t=re.sub(r'\s+[b-e]\s+(?=(to|,|and|or|\())',' ',t)
    t=t.replace('CHA DS -VA','CHA₂DS₂-VA').replace('kg/m ','kg/m² ').replace('kg/m,','kg/m²,').replace('SpO <','SpO₂ <').replace('PaO <','PaO₂ <').replace('Na -guided','Na⁺-guided').replace('foetotocixity','foetotoxicity')
    t=re.sub(r'\s+([.,;])',r'\1',t); t=re.sub(r'\s+',' ',t).strip()
    t=re.sub(r'(?<=[a-z])\.\s?[b-e]\s*$','.',t)
    return t
for i,x in enumerate(r):
    if i in FIX:
        cl,lv,tx,tb=FIX[i]; x=dict(x); x['text']=tx; x['table']=tb
        if cl: x['cls'],x['lvl']=cl,lv
    else: x['text']=clean(x['text'])
    out.append(x)
# missing: 108/109 table 22 ok; 
out=[x for x in out]
TT={1:"Prevention of heart failure",2:"Stage B heart failure & LV dysfunction",3:"Diagnostic investigations in suspected HF",4:"Specialized diagnostic investigations (aetiology)",5:"Pharmacological management of chronic HF",6:"ICD implantation",7:"Cardiac resynchronization therapy",8:"Pre-/early post-discharge follow-up after DHF",9:"Immediate & intermediate treatment of decompensated HF",10:"Temporary MCS in cardiogenic shock",11:"Diagnosis & evaluation of advanced HF",12:"Medical management of advanced HF",13:"Durable MCS in advanced HF",14:"Heart transplantation",15:"Atrial fibrillation in HF",16:"Revascularization in chronic coronary syndrome",17:"Valvular heart disease in HF",18:"Obesity in HF",19:"Iron deficiency in HF",20:"Lung disease & sleep-disordered breathing",21:"Anxiety, depression & frailty",22:"Other non-CV comorbidities",23:"Multidisciplinary management",24:"Exercise training & cardiac rehabilitation",25:"Invasive & non-invasive telemonitoring",26:"Long-term follow-up, advance care & palliative care",27:"HF and pregnancy",28:"Cardiac amyloidosis"}
SEC={1:"4.1",2:"4.2",3:"5.1",4:"5.3",5:"6.1",6:"6.2.1",7:"6.2.2",8:"7.4.3",9:"7.5",10:"7.5.11",11:"8.1",12:"8.2.1",13:"8.2.2.2",14:"8.2.3",15:"9.1.1",16:"9.2.2",17:"9.3",18:"10.1",19:"10.4",20:"10.6",21:"10.7",22:"10.9",23:"11.1",24:"11.4",25:"11.5",26:"11.6",27:"12.1",28:"12.3"}
def q(t,cl):
    s=t.strip()
    m=re.search(r'^(.*?)\s+(is|are)\s+not recommended\b(.*)$',s)
    if m: return f"Is {m.group(1)} recommended{m.group(3).rstrip('.')}?"
    for pat,w in [(r'\s+(is|are)\s+recommended\b',None),(r'\s+should be considered\b','Should'),(r'\s+may be considered\b','May')]:
        m=re.search(r'^(.*?)'+pat+r'(.*)$',s)
        if m:
            subj=m.group(1); rest=m.group(len(m.groups()))
            if pat.startswith(r'\s+(is'):
                return f"{'Are' if m.group(2)=='are' else 'Is'} {subj} recommended{rest.rstrip('.')}?"
            return f"{w} {subj} be considered{rest.rstrip('.')}?"
    return "What does the guideline recommend: "+s.rstrip('.')+"?"
final=[]
for i,x in enumerate(sorted(out,key=lambda x:(x['table'],x['page'],0 if x['t']!='R' else 1,x['y']))):
    t=x['text']; t=t[0].upper()+t[1:] if t else t
    n=x['table']
    final.append(dict(id=f"R{len(final)+1:03d}",table=n,topic=TT[n],section=SEC[n],cls=x['cls'],lvl=x['lvl'],page=x['page'],q=q(t,x['cls']),text=t))
json.dump(final,open('build/data/recs.json','w'),ensure_ascii=False)
print(len(final))
import collections
print(collections.Counter(f['cls'] for f in final))
bad=[f for f in final if len(f['text'])<40 or re.search(r'\b\d{3,4}\b$',f['text']) or f['text'][:1].islower()]
for f in bad: print('BAD',f['id'],f['text'][:150])
for f in final[:6]+final[40:44]: print(f['q'])
