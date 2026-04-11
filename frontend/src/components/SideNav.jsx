import { NavLink, useNavigate } from 'react-router-dom'
import useStore from '../store/index'

function SideNav() {
    const { user, logout } = useStore()
    const navigate = useNavigate()

    function handleLogout() {
        logout()
        navigate('/login')
    }

    const links = [
        { to: '/',         label: 'Home'        },
        { to: '/browse',   label: 'Browse'      },
        { to: '/saved',    label: 'Saved'       },
        { to: '/mydecks',  label: 'My Decks'    },
        { to: '/create',   label: 'Create Deck' },
    ]

    const username = user?.user_metadata?.username || user?.email?.split('@')[0] || ''

    return (
        <nav className="fixed top-0 left-0 w-56 h-screen bg-zinc-950 flex flex-col">
            <div className="px-5 py-5 border-b border-white/10">
                <span className="text-white font-semibold text-lg tracking-tight">Karta</span>
            </div>

            <ul className="flex flex-col gap-0.5 p-3 flex-1">
                {links.map(link => (
                    <li key={link.to}>
                        <NavLink
                            to={link.to}
                            end={link.to === '/'}
                            className={({ isActive }) =>
                                `block px-3 py-2 rounded-lg text-sm transition-colors ${
                                    isActive
                                        ? 'bg-white/10 text-white font-medium'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`
                            }
                        >
                            {link.label}
                        </NavLink>
                    </li>
                ))}
            </ul>

            {user && (
                <div className="border-t border-white/10 p-3">
                    <div className="px-3 py-1.5 text-xs text-zinc-500 truncate">{username}</div>
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        Sign out
                    </button>
                </div>
            )}
        </nav>
    )
}

export default SideNav
