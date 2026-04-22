// src/pages/dashboard/Settings.tsx
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, BellRing, MonitorSmartphone } from 'lucide-react';

export const Settings = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-white">Platform Settings</h2>
      
      <Card className="border-neutral-900">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BellRing className="w-4 h-4 text-blue-500" /> Alert Thresholds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-200">Critical Alerts Email</p>
              <p className="text-xs text-neutral-500">Receive instant email for critical intrusions.</p>
            </div>
            <div className="w-10 h-5 bg-blue-600 rounded-full relative"><span className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" /></div>
          </div>
          
          <div className="flex items-center justify-between border-t border-neutral-900 pt-6">
            <div>
              <p className="text-sm text-neutral-200">Dashboard Theme</p>
              <p className="text-xs text-neutral-500">Currently set to OLED-Dark (SOC optimized).</p>
            </div>
            <select className="bg-black border border-neutral-800 text-xs p-1 rounded">
              <option>Dark SOC</option>
              <option>Ghost Blue</option>
            </select>
          </div>
        </CardContent>
      </Card>
      
      <Button className="w-full md:w-fit">Save Configurations</Button>
    </div>
  );
};