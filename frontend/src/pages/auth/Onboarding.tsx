import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '../../api/client';
import { useAuthStore } from '../../stores/auth.store';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { CheckCircle2 } from 'lucide-react';

const onboardingSchema = z.object({
    full_name: z.string().min(2, "Full name is required"),
    company_name: z.string().min(2, "Workspace/Company name is required"),
    user_persona: z.enum(["student", "solo_dev", "corporate"])
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export const Onboarding = () => {
    const navigate = useNavigate();
    const { token, user, setAuth } = useAuthStore();
    const [serverError, setServerError] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<OnboardingFormValues>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: { user_persona: "corporate" }
    });

    const onSubmit = async (data: OnboardingFormValues) => {
        setServerError(null);
        try {
            const response = await apiClient.post('/auth/onboard', {
                ...data,
                plan: "enterprise" 
            });
            
            setApiKey(response.data.sensor_api_key);
            
            if (token && user) {
                setAuth(token, user, true);
            }
            
            toast.success('Workspace initialized successfully!');
            
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || "Failed to initialize workspace.";
            setServerError(errorMsg);
            toast.error(errorMsg);
        }
    };

    if (apiKey) {
        return (
            <div className="w-full max-w-lg p-8 bg-[#0a0a0a] border border-green-900/50 rounded-xl shadow-2xl text-center">
                <div className="flex justify-center mb-6">
                    <CheckCircle2 className="w-16 h-16 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Workspace Initialized</h2>
                <p className="text-neutral-400 mb-6">
                    Your sensor integration key is ready. Please copy this key to your W-IDS Python Sensor environment variables.
                </p>
                
                <div className="bg-[#111] p-4 rounded-lg border border-neutral-800 font-mono text-sm text-blue-400 break-all mb-8 select-all">
                    {apiKey}
                </div>
                
                <Button 
                    onClick={() => navigate('/dashboard')}
                    variant="primary"
                    size="lg"
                    className="w-full"
                >
                    Enter Command Center
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md p-8 bg-[#0a0a0a] border border-neutral-900 rounded-xl shadow-2xl">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white tracking-wide">Finalize Setup</h2>
                <p className="text-sm text-neutral-500 mt-2">Configure your isolated security workspace</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {serverError && (
                    <div className="p-3 bg-red-950/50 border border-red-900/50 rounded text-red-500 text-sm">
                        {serverError}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Full Name</label>
                    <Input 
                        {...register('full_name')}
                        placeholder="Jane Doe"
                        error={!!errors.full_name}
                    />
                    {errors.full_name && <p className="text-red-500 text-xs mt-1.5">{errors.full_name.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Workspace Name</label>
                    <Input 
                        {...register('company_name')}
                        placeholder="Acme Corp Security"
                        error={!!errors.company_name}
                    />
                    {errors.company_name && <p className="text-red-500 text-xs mt-1.5">{errors.company_name.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Persona</label>
                    <select 
                        {...register('user_persona')}
                        className="flex h-10 w-full rounded-md border border-neutral-800 bg-[#111] px-3 py-2 text-sm text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                        <option value="corporate">Corporate / Enterprise</option>
                        <option value="solo_dev">Solo Developer</option>
                        <option value="student">Student / Researcher</option>
                    </select>
                    {errors.user_persona && <p className="text-red-500 text-xs mt-1.5">{errors.user_persona.message}</p>}
                </div>

                <Button 
                    type="submit" 
                    variant="primary"
                    className="w-full mt-6"
                    isLoading={isSubmitting}
                >
                    Initialize Workspace
                </Button>
            </form>
        </div>
    );
};