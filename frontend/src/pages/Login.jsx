import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        navigate('/')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
            <div className="w-full max-w-md bg-white rounded-xl border border-stone-200 p-8 shadow-sm">
                <h1 className="text-2xl font-semibold text-stone-900 mb-2">Welcome back</h1>
                <p className="text-stone-500 text-sm mb-8">Sign in to your Karta account</p>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="text-sm font-medium text-stone-700 block mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-stone-700 block mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-600 transition-colors mt-2 disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <p className="text-sm text-stone-500 text-center mt-6">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-indigo-600 font-medium hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Login
