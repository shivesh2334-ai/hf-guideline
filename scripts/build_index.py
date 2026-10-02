import json,re,math,collections
pages=json.load(open('build/data/pages.json')); secs=json.load(open('build/data/sections.json'))['sections']
recs=json.load(open('build/data/recs.json')); drugs=json.load(open('build/data/drugs.json'))
STOP=set("the of and to in a an is are be for with on or by as at from that this it its was were which who whom than then these those into not no may should can also such more most other their there been has have had but if".split())
def tok(s):
    out=[]
    for t in re.findall(r'[a-z0-9]+',s.lower()):
        if len(t)<2 or t in STOP: continue
        if len(t)>3 and t.endswith('s') and not t.endswith('ss'): t=t[:-1]
        out.append(t)
    return out
def secfor(p):
    c=[s for s in secs if s['page']<=p and s['level']>=2]
    return c[-1]['id'] if c else ''
chunks=[]
for p in sorted(map(int,pages)):
    buf=''
    for para in pages[str(p)]:
        buf=(buf+' '+para).strip()
        if len(buf)>900:
            chunks.append(dict(type='text',page=p,section=secfor(p),title=f'Guideline text, p.{p}',text=buf)); buf=''
    if len(buf)>120: chunks.append(dict(type='text',page=p,section=secfor(p),title=f'Guideline text, p.{p}',text=buf))
for r in recs:
    chunks.append(dict(type='rec',page=r['page'],section=r['section'],title=f"{r['id']} · Class {r['cls']} / Level {r['lvl']} · {r['topic']}",text=r['text'],ref=r['id']))
for d in drugs:
    t=f"{d['name']}. {d['group']}. {d['summary']} "+' '.join(d['points']+d['cautions'])+(f" Starting dose {d['start']}; target dose {d['target']}." if d['start'] and d['start']!='—' else '')
    chunks.append(dict(type='drug',page=int(re.findall(r'\d+',d['pages'])[0]),section='6.1',title=f"Drug: {d['name']}",text=t,ref=d['id']))
for i,c in enumerate(chunks): c['id']=i
df=collections.Counter(); toks=[]
for c in chunks:
    ts=tok(c['title']+' '+c['text']); toks.append(ts); df.update(set(ts))
vocab=sorted(df); idx={t:i for i,t in enumerate(vocab)}; N=len(chunks)
idf=[round(math.log((N+1)/(df[t]+1))+1,4) for t in vocab]
vecs=[]
for ts in toks:
    tf=collections.Counter(ts); v={idx[t]:(1+math.log(n))*idf[idx[t]] for t,n in tf.items()}
    norm=math.sqrt(sum(x*x for x in v.values())) or 1
    vecs.append([[k,round(x/norm,4)] for k,x in v.items()])
json.dump(chunks,open('build/data/chunks.json','w'),ensure_ascii=False)
json.dump(dict(vocab=vocab,idf=idf,vecs=vecs),open('build/data/index.json','w'))
print(N,len(vocab))
