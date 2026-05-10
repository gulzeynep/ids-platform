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
import.meta.env

const registerSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], 
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [serverError, setServerError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema)
    });

    const onSubmit = async (data: RegisterFormValues) => {
        useAuthStore.getState().logout();
        setServerError(null);
        try {
            await apiClient.post('/auth/register', {
                email: data.email,
                password: data.password
            });
            
            toast.success('Clearance granted. Initializing session...');

            const formData = new URLSearchParams();
            formData.append('username', data.email);
            formData.append('password', data.password);

            const response = await apiClient.post('/auth/token', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const token = response.data.access_token;
            
            const profileRes = await apiClient.get(`/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const userObj = profileRes.data;
            const hasWorkspace = userObj.workspace_id !== null;

            setAuth(token, userObj, hasWorkspace);
            
            navigate('/onboarding');
            
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || "Registration failed. Email might be in use.";
            setServerError(errorMsg);
            toast.error(errorMsg);
        }
    };

    return (
        <div className="w-full max-w-md p-8 bg-[#0a0a0a] border border-neutral-900 rounded-xl shadow-2xl">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white tracking-wide">Request Access</h2>
                <p className="text-sm text-neutral-500 mt-2">Join the W-IDS security network</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                        placeholder="analyst@domain.com"
                        error={!!errors.email}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Password</label>
                    <Input 
                        {...register('password')}
                        type="password" 
                        placeholder="••••••••"
                        error={!!errors.password}
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Confirm Password</label>
                    <Input 
                        {...register('confirmPassword')}
                        type="password" 
                        placeholder="••••••••"
                        error={!!errors.confirmPassword}
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
                </div>

                <Button 
                    type="submit" 
                    variant="primary"
                    className="w-full mt-4"
                    isLoading={isSubmitting}
                >
                    Create Account
                </Button>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-500">
                Already have clearance? <Link to="/login" className="text-blue-500 hover:underline">Sign in</Link>
            </div>
        </div>
    );
};