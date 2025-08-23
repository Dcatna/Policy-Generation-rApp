import {useEffect, useState} from 'react';
import {getRicList, getPolicyTypes} from '../data/rapp_functions';
import type { RicInfo } from '@/data/types';

export function PolicyBuilderButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={()=>setOpen(true)} className="px-4 py-2 rounded-lg border">
        New Policy
      </button>
      {open && <PolicyBuilder onClose={()=>setOpen(false)} />}
    </>
  );
}

function PolicyBuilder({onClose}:{onClose:()=>void}) {
  const [rics, setRics] = useState<string[]>([]);
  const [ric, setRic] = useState<string>('');
  const [types, setTypes] = useState<any[]>([]);
  const [ptype, setPtype] = useState<string>('');
  const [policyId, setPolicyId] = useState<string>('demo-policy-ui');
  const [data, setData] = useState<string>('{"note":"from-ui","limit":25}');

  useEffect(()=>{
    setRics([])
    setTypes([])
    getRicList().then(r=> r.map((ric : RicInfo) => {
        setRics([...rics, ric.ric_id])
    }));
  },[]);
  useEffect(()=>{
    if (!ric) return setTypes([]);
    getPolicyTypes(ric).then(setTypes).catch(console.error);

  },[ric]);

  const submit = async () => {
    try {
      const payload = {
        policy_id: policyId,
        ric_id: ric,
        policytype_id: ptype ?? '',
        policy_data: JSON.parse(data),
      };
      const res = await fetch('/api/policies', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      onClose();
    } catch (e:any) {
      alert(e?.message ?? 'Failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-white w-[640px] max-w-[95vw] rounded-2xl p-6 shadow-xl">
        <div className="text-lg font-semibold mb-4">New Policy</div>
        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm col-span-1">RIC</label>
          <select value={ric} onChange={e=>setRic(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="">Select Ric…</option>
            {rics.map(r=><option key={r} value={r}>{r}</option>)}
          </select>

          <label className="text-sm col-span-1">Policy Type</label>
          <select value={ptype} onChange={e=>setPtype(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="">(empty)</option>
            {types.map((t:any)=><option key={t} value={t}>{t}</option>)}
          </select>

          <label className="text-sm col-span-1">Policy ID</label>
          <input value={policyId} onChange={e=>setPolicyId(e.target.value)} className="border rounded-lg px-3 py-2"/>

          <label className="text-sm col-span-2">policy_data (JSON)</label>
          <textarea value={data} onChange={e=>setData(e.target.value)} className="border rounded-lg px-3 py-2 col-span-2 h-40 font-mono text-xs"/>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className="px-4 py-2 rounded-lg border" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded-lg bg-black text-white" onClick={submit}>Create / Update</button>
        </div>
      </div>
    </div>
  );
}
