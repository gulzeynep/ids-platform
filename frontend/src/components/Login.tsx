import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import api from '../lib/api';

// ZOD
const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [serverError, setServerError] = useState<string | null>(null);

    // FORM (React Hook Form)
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema)
    });

    // Sending
    const onSubmit = async (data: LoginFormValues) => {
        setServerError(null);
        try {
            const formData = new URLSearchParams();
            formData.append('username', data.email);
            formData.append('password', data.password);

            const response = await api.post('/auth/token', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const token = response.data.access_token;
            
            const profileRes = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const hasWorkspace = profileRes.data.workspace_id !== null;
            const role = profileRes.data.role;

            // save to zustand (Global State) 
            setAuth(token, hasWorkspace, role);

            navigate('/dashboard');
            
        } catch (error: any) {
            setServerError(error.response?.data?.detail || "Authentication failed. Please try again.");
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh]">
            <div className="w-full max-w-md p-8 bg-[#0a0a0a] border border-neutral-800 rounded-xl shadow-2xl">
                
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white tracking-wide">Welcome Back</h2>
                    <p className="text-sm text-neutral-500 mt-2">Sign in to your SOC Command Center</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Error Message */}
                    {serverError && (
                        <div className="p-3 bg-red-950/50 border border-red-900/50 rounded text-red-500 text-sm text-center">
                            {serverError}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Corporate Email</label>
                        <input 
                            {...register('email')}
                            type="email" 
                            className="w-full px-4 py-2.5 bg-[#111] border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="analyst@wids-core.io"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Secure Password</label>
                        <input 
                            {...register('password')}
                            type="password" 
                            className="w-full px-4 py-2.5 bg-[#111] border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="••••••••"
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center"
                    >
                        {isSubmitting ? "Authenticating..." : "Sign In"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-neutral-500">
                    Don't have an access clearance? <Link to="/register" className="text-blue-500 hover:underline">Request access</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;