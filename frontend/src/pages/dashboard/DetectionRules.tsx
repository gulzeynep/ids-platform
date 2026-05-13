import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, FileCode2, Plus, ShieldCheck, SlidersHorizontal, Trash2 } from 'lucide-react';
import apiClient from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'sonner';

interface DetectionRule {
    id: number;
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    match_type: 'contains' | 'regex' | 'snort';
    pattern: string;
    enabled: boolean;
    created_at: string;
}

interface DetectionProfile {
    profile: string;
    available_profiles: string[];
    engine_profile?: string | null;
    reload_requested?: boolean;
}

const exampleRule = 'alert tcp any any -> any 80 (msg:"LOCAL LynxGate custom admin probe"; flow:to_server,established; http_uri; content:"/lg-custom-trigger"; classtype:web-application-attack; sid:1000001; rev:1;)';
const sidFromRule = (rule: string) => rule.match(/\bsid\s*:\s*(\d+)\s*;/i)?.[1] ?? 'pending';

export const DetectionRules = () => {
    const queryClient = useQueryClient();
    const [ruleForm, setRuleForm] = useState({
        title: 'LOCAL LynxGate custom admin probe',
        severity: 'high' as DetectionRule['severity'],
        pattern: exampleRule,
        enabled: true,
    });

    const { data: detectionRules, isLoading: rulesLoading } = useQuery({
        queryKey: ['detection_rules'],
        queryFn: async () => {
            const response = await apiClient.get('/admin/detection-rules');
            return response.data as DetectionRule[];
        }
    });

    const { data: detectionProfile } = useQuery({
        queryKey: ['detection_profile'],
        queryFn: async () => {
            const response = await apiClient.get('/admin/detection-profile');
            return response.data as DetectionProfile;
        }
    });

    const customSnortRules = useMemo(
        () => detectionRules?.filter((rule) => rule.match_type === 'snort') ?? [],
        [detectionRules]
    );

    const createRuleMutation = useMutation({
        mutationFn: () => apiClient.post('/admin/detection-rules', {
            title: ruleForm.title,
            severity: ruleForm.severity,
            category: 'Custom Snort',
            match_type: 'snort',
            pattern: ruleForm.pattern,
            enabled: ruleForm.enabled,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['detection_rules'] });
            toast.success('Custom Snort rule saved and reload requested.');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.detail ?? 'Could not save this Snort rule.');
        }
    });

    const updateRuleMutation = useMutation({
        mutationFn: ({ ruleId, data }: { ruleId: number; data: Partial<DetectionRule> }) =>
            apiClient.patch(`/admin/detection-rules/${ruleId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['detection_rules'] });
            toast.success('Custom Snort rule updated and reload requested.');
        }
    });

    const deleteRuleMutation = useMutation({
        mutationFn: (ruleId: number) => apiClient.delete(`/admin/detection-rules/${ruleId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['detection_rules'] });
            toast.info('Custom Snort rule removed.');
        }
    });

    const profileMutation = useMutation({
        mutationFn: (profile: string) => apiClient.patch('/admin/detection-profile', { profile }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['detection_profile'] });
            toast.success('Detection profile saved. Snort reload requested.');
        },
        onError: () => toast.error('Could not update the Snort profile.')
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header>
                <h2 className="text-2xl font-bold text-white tracking-wide">DETECTION_RULES</h2>
                <p className="text-sm text-neutral-500">Tune the live Snort profile and manage persistent custom detection rules</p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.7fr)] gap-6">
                <section className="space-y-6">
                    <Card className="border-neutral-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <SlidersHorizontal className="w-5 h-5 text-blue-500" /> Snort Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm text-neutral-300">Active detection profile controls which official rule set Snort loads with your custom rules.</p>
                                <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                                    Engine: {detectionProfile?.engine_profile || 'unknown'} {detectionProfile?.reload_requested ? '| reload pending' : '| in sync'}
                                </p>
                            </div>
                            <select
                                value={detectionProfile?.profile || 'web-official'}
                                onChange={(e) => profileMutation.mutate(e.target.value)}
                                className="h-10 min-w-48 rounded-md border border-neutral-800 bg-[#111] px-3 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {(detectionProfile?.available_profiles || ['web-official', 'web-balanced', 'web-full', 'local-only']).map((profile) => (
                                    <option key={profile} value={profile}>{profile}</option>
                                ))}
                            </select>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BookOpen className="w-5 h-5 text-blue-500" /> Rule Format
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-neutral-400">
                            <p>Use one-line Snort 3 alert rules. Custom SIDs must be unique and greater than or equal to 1000000.</p>
                            <div className="grid gap-2 rounded-lg border border-neutral-800 bg-black/30 p-4 font-mono text-xs text-neutral-300">
                                <span>Required: alert action, msg, sid, rev, and a valid option block.</span>
                                <code className="whitespace-pre-wrap break-all">{exampleRule}</code>
                            </div>
                            <p>HTTP rules can use sticky buffers such as <span className="font-mono text-neutral-200">http_uri</span> or <span className="font-mono text-neutral-200">http_header</span>. UDP/TCP rules can use normal <span className="font-mono text-neutral-200">content</span>, ports, and direction operators.</p>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileCode2 className="w-5 h-5 text-blue-500" /> Add Custom Rule
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_160px] gap-4">
                                <div>
                                    <label className="text-xs text-neutral-500 mb-1.5 block uppercase tracking-wider">Rule Name</label>
                                    <Input value={ruleForm.title} onChange={(e) => setRuleForm({ ...ruleForm, title: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs text-neutral-500 mb-1.5 block uppercase tracking-wider">Severity</label>
                                    <select
                                        className="h-10 w-full rounded-md border border-neutral-800 bg-[#111] px-3 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={ruleForm.severity}
                                        onChange={(e) => setRuleForm({ ...ruleForm, severity: e.target.value as DetectionRule['severity'] })}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-neutral-500 mb-1.5 block uppercase tracking-wider">Snort Rule</label>
                                <textarea
                                    className="min-h-36 w-full resize-y rounded-md border border-neutral-800 bg-[#111] px-3 py-3 font-mono text-xs leading-5 text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={ruleForm.pattern}
                                    onChange={(e) => setRuleForm({ ...ruleForm, pattern: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <label className="inline-flex items-center gap-2 text-sm text-neutral-400">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-neutral-700 bg-[#111]"
                                        checked={ruleForm.enabled}
                                        onChange={(e) => setRuleForm({ ...ruleForm, enabled: e.target.checked })}
                                    />
                                    Enable immediately
                                </label>
                                <Button disabled={!ruleForm.title || !ruleForm.pattern || createRuleMutation.isPending} onClick={() => createRuleMutation.mutate()}>
                                    <Plus className="w-4 h-4 mr-2" /> Save and Reload Snort
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <Card className="border-neutral-900 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-base">Persistent Custom Rules</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {rulesLoading ? (
                            <p className="py-8 text-center text-neutral-600">Loading custom rules...</p>
                        ) : customSnortRules.length === 0 ? (
                            <p className="py-8 text-center text-neutral-600">No custom Snort rules yet.</p>
                        ) : (
                            customSnortRules.map((rule) => (
                                <div key={rule.id} className="rounded-lg border border-neutral-900 bg-black/30 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-white">{rule.title}</p>
                                            <p className="mt-1 text-xs uppercase tracking-wider text-neutral-500">SID {sidFromRule(rule.pattern)} / {rule.severity}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={rule.enabled ? 'text-green-500' : 'text-neutral-500'}
                                                onClick={() => updateRuleMutation.mutate({ ruleId: rule.id, data: { enabled: !rule.enabled } })}
                                                title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                                            >
                                                <ShieldCheck className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="hover:text-red-500" onClick={() => deleteRuleMutation.mutate(rule.id)} title="Delete rule">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap break-all rounded-md bg-[#050505] p-3 font-mono text-[11px] leading-4 text-neutral-400">{rule.pattern}</pre>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
