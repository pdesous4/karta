import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useStore from './store/index'
import SideNav from './components/SideNav'
import Home from './pages/Home'
import Study from './pages/Study'
import Browse from './pages/Browse'
import CreateDeck from './pages/CreateDeck'
import MyDecks from './pages/MyDecks'
import Login from './pages/Login'
import Register from './pages/Register'

function ProtectedRoute({ children }) {
    const { user, isLoading } = useStore()
    if (isLoading) return null
    if (!user) return <Navigate to="/login" />
    return children
}

function App() {
    const { loadUser } = useStore()

    useEffect(() => {
        loadUser()
    }, [])

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/*" element={
                    <ProtectedRoute>
                        <div className="flex min-h-screen bg-white">
                            <SideNav />
                            <main className="ml-56 flex-1 p-12">
                                <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/study/:deckId" element={<Study />} />
                                    <Route path="/browse" element={<Browse />} />
                                    <Route path="/create" element={<CreateDeck />} />
                                    <Route path="/mydecks" element={<MyDecks />} />
                                </Routes>
                            </main>
                        </div>
                    </ProtectedRoute>
                } />
            </Routes>
        </BrowserRouter>
    )
}

export default App
