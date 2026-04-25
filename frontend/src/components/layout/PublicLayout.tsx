import { Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from '../../stores/auth.store';

export const PublicLayout = () => {
    const { isAuthenticated, hasWorkspace } = useAuthStore();

    if (isAuthenticated && hasWorkspace) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-200 font-sans selection:bg-blue-500/30">
            <Toaster theme="dark" position="bottom-right" richColors closeButton />
            <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
                <Outlet />
            </main>
        </div>
    );
};