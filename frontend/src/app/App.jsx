import { useState } from "react";
import { Activity, CircleHelp, Dumbbell, House, UserRound, Utensils } from "lucide-react";
import AboutPage from "../pages/AboutPage/AboutPage.jsx";
import InstallAppPrompt from "../pages/AboutPage/InstallAppPrompt.jsx";
import HomePage from "../pages/HomePage/HomePage.jsx";
import NutritionPage from "../pages/NutritionPage/NutritionPage.jsx";
import ProfilePage from "../pages/ProfilePage/ProfilePage.jsx";
import ProgressPage from "../pages/ProgressPage/ProgressPage.jsx";
import TrainingPage from "../pages/TrainingPage/TrainingPage.jsx";
import AuthGate from "../features/auth/AuthGate.jsx";
import ProfessorDashboard from "../pages/ProfessorDashboard/ProfessorDashboard.jsx";
import { GlobalRestTimer, RestTimerProvider } from "../features/training/RestTimerContext.jsx";
import WeeklyFeedbackGate from "../features/weeklyFeedback/WeeklyFeedbackGate.jsx";
import styles from "./App.module.css";

const navigation = [
  { id: "home", label: "Início", icon: House },
  { id: "training", label: "Treino", icon: Dumbbell },
  { id: "progress", label: "Evolução", icon: Activity },
  { id: "nutrition", label: "Dieta", icon: Utensils },
  { id: "profile", label: "Perfil", icon: UserRound },
  { id: "about", label: "Sobre", icon: CircleHelp },
];

export default function App() {
  const [activePage, setActivePage] = useState("home");
  const [trainingMovement, setTrainingMovement] = useState("exercise");
  const navigate = (page, movement = "exercise") => { if (page === "training") setTrainingMovement(movement); setActivePage(page); };
  const studentPage = (user) => ({
    training: <TrainingPage user={user} initialMovement={trainingMovement} />,
    progress: <ProgressPage user={user} />,
    nutrition: <NutritionPage user={user} />,
    about: <AboutPage role="student" />,
  })[activePage];

  return (
    <AuthGate>{(user) => user.role === "professor" ? <><ProfessorDashboard user={user} /><InstallAppPrompt userId={user.id} /></> : (
      <WeeklyFeedbackGate userId={user.id}>
      <RestTimerProvider userId={user.id}>
        <div className={styles.shell}>
          {activePage === "home" ? <HomePage user={user} onNavigate={navigate} /> : activePage === "profile" ? <ProfilePage user={user} /> : studentPage(user)}
          <GlobalRestTimer />
          <nav className={styles.navigation} aria-label="Navegação principal">
            {navigation.map(({ id, label, icon: Icon }) => (
              <button key={id} className={activePage === id ? styles.active : ""} onClick={() => navigate(id)} aria-current={activePage === id ? "page" : undefined}>
                <Icon size={18} /><span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </RestTimerProvider>
      <InstallAppPrompt userId={user.id} />
      </WeeklyFeedbackGate>
    )}</AuthGate>
  );
}
