import "@/App.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ClubProvider, useClub } from "@/context/ClubContext";
import { WheelLoader } from "@/components/moto/WheelLoader";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import MemberArea from "@/pages/MemberArea";
import AdminArea from "@/pages/AdminArea";

const Protected = ({ children, admin }) => {
  const { user } = useAuth();
  if (user === null) return <WheelLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "admin") return <Navigate to="/membro" replace />;
  return children;
};

const AppRoutes = () => {
  const { club } = useClub();
  if (!club) return <WheelLoader />;
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/membro" element={<Protected><MemberArea /></Protected>} />
      <Route path="/admin" element={<Protected admin><AdminArea /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <div className="App dark">
      <BrowserRouter>
        <ClubProvider>
          <AuthProvider>
            <AppRoutes />
            <Toaster theme="dark" richColors position="top-right" />
          </AuthProvider>
        </ClubProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
