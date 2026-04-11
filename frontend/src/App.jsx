import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import useStore from "./store/index";
import SideNav from "./components/SideNav";

const Home = lazy(() => import("./pages/Home"));
const Study = lazy(() => import("./pages/Study"));
const Browse = lazy(() => import("./pages/Browse"));
const CreateDeck = lazy(() => import("./pages/CreateDeck"));
const EditDeck = lazy(() => import("./pages/EditDeck"));
const MyDecks = lazy(() => import("./pages/MyDecks"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Saved = lazy(() => import("./pages/Saved"));

function ProtectedRoute({ children }) {
  const { user, isLoading } = useStore();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function App() {
  const { loadUser } = useStore();

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen text-sm text-stone-400">
            Loading...
          </div>
        }
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="flex min-h-screen bg-stone-50">
                  <SideNav />
                  <main className="ml-56 flex-1 px-10 py-8">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/study/:deckId" element={<Study />} />
                      <Route path="/browse" element={<Browse />} />
                      <Route path="/create" element={<CreateDeck />} />
                      <Route path="/edit/:deckId" element={<EditDeck />} />
                      <Route path="/mydecks" element={<MyDecks />} />
                      <Route path="/saved" element={<Saved />} />
                    </Routes>
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
