import { Outlet, Link } from 'react-router-dom';

const PublicLayout = () => {
    return (
        <div className="min-h-screen bg-black text-white font-sans">
            <nav className="px-8 py-6 border-b border-neutral-900 flex justify-between items-center">
                <div className="text-blue-500 font-bold text-2xl tracking-wider italic">W-IDS</div>
                <div className="space-x-6 text-sm font-medium">
                    <Link to="/contact" className="text-neutral-400 hover:text-white transition-colors">Contact</Link>
                    <Link to="/login" className="text-neutral-400 hover:text-white transition-colors">Sign In</Link>
                    <Link to="/register" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-md transition-colors">Get Started</Link>
                </div>
            </nav>
            <main>
                <Outlet /> {/* Landing, Login etc. */}
            </main>
        </div>
    );
};

export default PublicLayout