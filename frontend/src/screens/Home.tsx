import { PolicyBuilderButton } from '@/components/PolicyBuilderButton';
import { getAppHealth, getAppVersion, getPolicyInstances, getServiceList, setPolicyLimit } from '@/data/rapp_functions';
import { usePolling } from '@/data/usePolling';
import {useState} from 'react';


export default function Home() {
  const {data: health}   = usePolling(getAppHealth,   5000, []);
  const {data: version}  = usePolling(getAppVersion,  15000, []);
  const {data: services} = usePolling(getServiceList, 10000, []);
  const {data: policies} = usePolling(getPolicyInstances, 10000, []);

  const [limit, setLimit] = useState<number>(21);
  const [msg, setMsg] = useState<string>('');

  const applyLimit = async () => {
    try {
      await setPolicyLimit(limit);
      setMsg(`Updated limit to ${limit}`);
    } catch (e: any) {
      setMsg(`Failed: ${e?.message ?? 'error'}`);
    } finally {
      setTimeout(()=>setMsg(''), 4000);
    }
  };
  console.log(health)
const ok = health === undefined ? '…' : (health?.ok ? '✅' : '❌');

  return (
    <div className="p-6 grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border p-5 shadow-sm">
        <div className="text-xl font-semibold mb-3">Status</div>
        <div className="space-y-1 text-sm">
          <div>Health: <b>{ok}</b></div>
          <div>Version: <b>{version ?? '...'}</b></div>
          <div>Services: <b>{services ? services.service_list.length : '...'}</b></div>
          <div>Policies: <b>{policies ? policies.policies.length : '...'}</b></div>
          <div className="text-xs text-gray-500">auto-refreshing…</div>
        </div>
      </div>

      <div className="rounded-2xl border p-5 shadow-sm">
        <div className="text-xl font-semibold mb-3">Quick actions</div>
        <label className="text-sm">Policy limit</label>
        <div className="flex gap-2 mt-1">
          <input
            type="number"
            className="border rounded-lg px-3 py-2 w-40"
            value={limit}
            onChange={e=>setLimit(Number(e.target.value))}
          />
          <button
            onClick={applyLimit}
            className="px-4 py-2 rounded-lg bg-black text-white"
          >
            Apply
          </button>
        </div>
        {msg && <div className="mt-2 text-sm">{msg}</div>}

        <div className="mt-6">
          <PolicyBuilderButton />
        </div>
      </div>

      <div className="md:col-span-2 rounded-2xl border p-5 shadow-sm">
        <PoliciesTable items={policies?.policies ?? []}/>
      </div>
    </div>
  );
}

function PoliciesTable({items}:{items:any[]}) {
  return (
    <div>
      <div className="text-lg font-semibold mb-3">Policies</div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">policy_id</th>
              <th className="py-2 pr-4">ric_id</th>
              <th className="py-2 pr-4">policytype_id</th>
              <th className="py-2 pr-4">service_id</th>
              <th className="py-2">policy_data</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p, i)=>(
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="py-2 pr-4">{p.policy_id}</td>
                <td className="py-2 pr-4">{p.ric_id}</td>
                <td className="py-2 pr-4">{p.policytype_id}</td>
                <td className="py-2 pr-4">{p.service_id}</td>
                <td className="py-2"><code className="text-xs">{JSON.stringify(p.policy_data)}</code></td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={5} className="py-4 text-center text-gray-500">No policies</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
