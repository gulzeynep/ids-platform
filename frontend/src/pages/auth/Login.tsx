import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '../../api/client';
import { useAuthStore } from '../../stores/auth.store';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [serverError, setServerError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = async (data: LoginFormValues) => {
        setServerError(null);
        try {
            const formData = new URLSearchParams();
            formData.append('username', data.email);
            formData.append('password', data.password);

            const response = await apiClient.post('/auth/token', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const token = response.data.access_token;
            
            const profileRes = await apiClient.get('/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const hasWorkspace = profileRes.data.workspace_id !== null;

            setAuth(token, profileRes.data, hasWorkspace);
            
            toast.success('Authentication successful. Welcome back.');
            
            if (hasWorkspace) {
                navigate('/dashboard');
            } else {
                navigate('/onboarding');
            }
            
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || "Authentication failed. Please check your credentials.";
            setServerError(errorMsg);
            toast.error(errorMsg);
        }
    };

    return (
        <div className="w-full max-w-md p-8 bg-[#0a0a0a] border border-neutral-900 rounded-xl shadow-2xl">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white tracking-wide">Welcome Back</h2>
                <p className="text-sm text-neutral-500 mt-2">Sign in to your SOC Command Center</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {serverError && (
                    <div className="p-3 bg-red-950/50 border border-red-900/50 rounded text-red-500 text-sm text-center">
                        {serverError}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Corporate Email</label>
                    <Input 
                        {...register('email')}
                        type="email" 
                        placeholder="analyst@wids-core.io"
                        error={!!errors.email}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Secure Password</label>
                    <Input 
                        {...register('password')}
                        type="password" 
                        placeholder="••••••••"
                        error={!!errors.password}
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
                </div>

                <Button 
                    type="submit" 
                    variant="primary"
                    className="w-full mt-2"
                    isLoading={isSubmitting}
                >
                    Sign In
                </Button>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-500">
                Don't have access clearance? <Link to="/register" className="text-blue-500 hover:underline">Request access</Link>
            </div>
        </div>
    );
};