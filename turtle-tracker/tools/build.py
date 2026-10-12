import json, datetime as dt
p=json.load(open('/Users/williamford/Downloads/turtle-portfolio-2026-10-08.json'))
for l in p['leaps']:
    l.setdefault('closeDate',None); l.setdefault('closePremium',None)
L={l['id']:l for l in p['leaps']}
L250,L225='LEAPS_1784815766672','LEAPS_1785599110482'
chain=[[291,'2026-09-18','2026-09-11',191,'2026-09-15',59],[285,'2026-09-18','2026-09-15',286,'2026-09-16',314],[285,'2026-09-18','2026-09-16',329,'2026-09-18',6],[284,'2026-09-25','2026-09-22',453,'2026-09-23',123],[280,'2026-10-02','2026-09-24',345,'2026-10-02',245],[280,'2026-10-09','2026-10-02',409,'2026-10-08',14]]
plan={L250:[[303,'2026-08-21','2026-08-19',150,'2026-08-20',8],[292,'2026-09-04','2026-09-01',226,'2026-09-04',265],[297,'2026-09-11','2026-09-04',135,'2026-09-11',1]]+chain,
      L225:[[293,'2026-09-04','2026-09-02',200,'2026-09-04',180],[296,'2026-09-11','2026-09-04',179,'2026-09-10',13],[290,'2026-09-11','2026-09-10',134,'2026-09-11',34]]+chain}
calls=[c for c in p['calls'] if not (c['parentLeapsId'] in plan and c['openDate']>='2026-09-01')]
for pid,rows in plan.items():
    for r in rows: calls.append(dict(parentLeapsId=pid,strike=r[0],openDate=r[2],openPremium=r[3],closeDate=r[4],closePremium=r[5],status='closed'))
for c in calls:
    if c['parentLeapsId']=='LEAPS_1782230474602':
        if c['strike']==300 and c['openDate']=='2026-08-07': c['closePremium']=866
        if c['strike']==302 and c['openDate']=='2026-08-19': c['openPremium'],c['closePremium']=310,40
hist={k:[(h['date'] or L[k]['openDate'],h['value']) for h in v] for k,v in p['history'].items()}
hist[L225].append(('2026-10-08',6662)); hist[L250].append(('2026-10-08',4761))
for k in hist: hist[k].sort(key=lambda x:x[0])
# checks
def realized(pid): return sum(c['openPremium']-c['closePremium'] for c in calls if c['parentLeapsId']==pid and c['status']=='closed')
print('check calls realized IBKR250 3237:',realized('LEAPS_1782230474602'),'tasty250 1606:',realized(L250),'tasty225 1445:',realized(L225))
# weekly dates
bars=json.load(open('iwm.json'))
t=[x[:10] for x in bars['time']]; cl=bars['close']
ends=[]
for d,c in zip(t,cl):
    dd=dt.date.fromisoformat(d); e=min(dd+dt.timedelta(days=4), dt.date(2026,10,7)) if d!='2026-10-08' else dd
    ends.append((e.isoformat(),c))
# start at week ending 2026-01-02
ends=[e for e in ends if e[0]>='2026-01-02']
def mark(pid,D):
    h=[v for d,v in hist.get(pid,[]) if d<=D]
    return h[-1] if h else None
def state(D):
    real=0; unreal=0; base=0; reserves={}
    for l in p['leaps']:
        pid=l['id']; n=l.get('contracts') or 1
        if l['openDate']<=D:
            closed=l['closeDate'] and l['closeDate']<=D
            if closed:
                real+=(l['closePremium']-l['openPremium'])*n
            else:
                m=mark(pid,D); m=l['openPremium'] if m is None else m
                unreal+=(m-l['openPremium'])*n
                base+=l['openPremium']*n
                acct='Tasty' if l['accountName'].startswith('Tasty') else 'IBKR'
                reserves[acct]=max(reserves.get(acct,0),0)+0
                reserves.setdefault(acct,[]).append(l['cashReserve']) if False else None
    return real,unreal,base
def base_at(D):
    tasty = 0 if D < '2026-01-07' else (19201.38 + (4000 if D >= '2026-06-24' else 0))
    ibkr = 0 if D < '2026-01-26' else (19011.05 if D < '2026-06-23' else 27990)
    return tasty + ibkr
out=[]; bench=0; prevpx=None; prevbase=0
for D,px in ends:
    real_l,unreal,_=state(D)
    rc=sum(c['openPremium']-c['closePremium'] for c in calls if c['status']=='closed' and c['closeDate']<=D)
    real=rc+real_l; tot=real+unreal; b=base_at(D)
    if prevpx: bench+=prevbase*(px/prevpx-1)
    out.append(dict(date=D,iwm=px,realized=round(real,2),unrealized=round(unreal,2),total=round(tot,2),base=round(b,2),bench=round(bench,2)))
    prevpx=px; prevbase=b
json.dump(out,open('series.json','w'))
for o in out[::4]+[out[-1]]: print(o)
