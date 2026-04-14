import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';

const registerSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], 
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
    const navigate = useNavigate();
    const [serverError, setServerError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema)
    });

    const onSubmit = async (data: RegisterFormValues) => {
        setServerError(null);
        try {
            // Backend schema expect only email and password
            await api.post('/auth/register', {
                email: data.email,
                password: data.password
            });
            
            // if successful -> login
            navigate('/login');
        } catch (error: any) {
            setServerError(error.response?.data?.detail || "Registration failed. Email might be in use.");
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh]">
            <div className="w-full max-w-md p-8 bg-[#0a0a0a] border border-neutral-800 rounded-xl shadow-2xl">
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
                        <input 
                            {...register('email')}
                            type="email" 
                            className="w-full px-4 py-2.5 bg-[#111] border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="analyst@domain.com"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Password</label>
                        <input 
                            {...register('password')}
                            type="password" 
                            className="w-full px-4 py-2.5 bg-[#111] border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="••••••••"
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Confirm Password</label>
                        <input 
                            {...register('confirmPassword')}
                            type="password" 
                            className="w-full px-4 py-2.5 bg-[#111] border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="••••••••"
                        />
                        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center mt-4"
                    >
                        {isSubmitting ? "Processing..." : "Create Account"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-neutral-500">
                    Already have clearance? <Link to="/login" className="text-blue-500 hover:underline">Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;