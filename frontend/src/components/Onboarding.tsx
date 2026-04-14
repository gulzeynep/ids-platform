import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import api from '../lib/api';

const onboardingSchema = z.object({
    full_name: z.string().min(2, "Full name is required"),
    company_name: z.string().min(2, "Workspace/Company name is required"),
    user_persona: z.enum(["student", "solo_dev", "corporate"]),
    plan: z.string()
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const Onboarding = () => {
    const navigate = useNavigate();
    const { token, role, setAuth } = useAuthStore();
    const [serverError, setServerError] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<OnboardingFormValues>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: { plan: "enterprise" }
    });

    const onSubmit = async (data: OnboardingFormValues) => {
        setServerError(null);
        try {
            const response = await api.post('/auth/onboard', data);
            
            // backend successful -> API Key 
            setApiKey(response.data.sensor_api_key);
            
            // Zustand store update
            if (token && role) {
                setAuth(token, true, role);
            }
            
        } catch (error: any) {
            setServerError(error.response?.data?.detail || "Failed to initialize workspace.");
        }
    };

    if (apiKey) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-black">
                <div className="w-full max-w-lg p-8 bg-[#0a0a0a] border border-green-900/50 rounded-xl shadow-2xl text-center">
                    <div className="w-16 h-16 bg-green-950 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">✓</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Workspace Initialized</h2>
                    <p className="text-neutral-400 mb-6">Your sensor integration key is ready. Please copy this key to your W-IDS Python Sensor environment variables.</p>
                    
                    <div className="bg-black p-4 rounded-lg border border-neutral-800 font-mono text-sm text-blue-400 break-all mb-8 select-all">
                        {apiKey}
                    </div>
                    
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-white text-black hover:bg-neutral-200 font-bold py-3 rounded-lg transition-colors"
                    >
                        Enter Command Center
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-black">
            <div className="w-full max-w-md p-8 bg-[#0a0a0a] border border-neutral-800 rounded-xl shadow-2xl">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white tracking-wide">Finalize Setup</h2>
                    <p className="text-sm text-neutral-500 mt-2">Configure your isolated workspace</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {serverError && (
                        <div className="p-3 bg-red-950/50 border border-red-900/50 rounded text-red-500 text-sm">
                            {serverError}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Full Name</label>
                        <input 
                            {...register('full_name')}
                            className="w-full px-4 py-2.5 bg-[#111] border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            placeholder="Jane Doe"
                        />
                        {errors.full_name && <p className="text-red-500 text-xs mt-1.5">{errors.full_name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Workspace Name</label>
                        <input 
                            {...register('company_name')}
                            className="w-full px-4 py-2.5 bg-[#111] border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            placeholder="Acme Corp"
                        />
                        {errors.company_name && <p className="text-red-500 text-xs mt-1.5">{errors.company_name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Persona</label>
                        <select 
                            {...register('user_persona')}
                            className="w-full px-4 py-2.5 bg-[#111] border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none"
                        >
                            <option value="corporate">Corporate / Enterprise</option>
                            <option value="solo_dev">Solo Developer</option>
                            <option value="student">Student / Researcher</option>
                        </select>
                        {errors.user_persona && <p className="text-red-500 text-xs mt-1.5">{errors.user_persona.message}</p>}
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg mt-6"
                    >
                        {isSubmitting ? "Deploying..." : "Initialize Workspace"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Onboarding;