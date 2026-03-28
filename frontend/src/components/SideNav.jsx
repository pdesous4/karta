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

    return (
        <nav className="fixed top-0 left-0 w-56 h-screen bg-gray-50 border-r border-gray-200 flex flex-col p-4">
            <div className="text-sm font-bold tracking-widest uppercase text-gray-900 px-3 py-4 mb-4">
                Karta
            </div>

            <ul className="flex flex-col gap-1 flex-1">
                {links.map(link => (
                    <li key={link.to}>
                        <NavLink
                            to={link.to}
                            end={link.to === '/'}
                            className={({ isActive }) =>
                                `block px-3 py-2 rounded-lg text-sm transition-colors ${
                                    isActive
                                        ? 'bg-gray-900 text-white'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                }`
                            }
                        >
                            {link.label}
                        </NavLink>
                    </li>
                ))}
            </ul>

            {user && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="px-3 py-2 text-sm text-gray-500">{user.user_metadata.username}</div>
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Sign out
                    </button>
                </div>
            )}
        </nav>
    )
}

export default SideNav
