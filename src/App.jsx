import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { Login } from './pages/Login/Login';
import { Register } from './pages/Register/Register';
import { Files } from './pages/Files/Files';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Recent } from './pages/Recent/Recent';
import { Favorites } from './pages/Favorites/Favorites';
import { Shared } from './pages/Shared/Shared';
import { Search } from './pages/Search/Search';
import { Calendar } from './pages/Calendar/Calendar';
import { Contacts } from './pages/Contacts/Contacts';
import { Notes } from './pages/Notes/Notes';
import { Tasks } from './pages/Tasks/Tasks';
import { Gallery } from './pages/Gallery/Gallery';
import { Boards } from './pages/Boards/Boards';
import { Activity } from './pages/Activity/Activity';
import { Tags } from './pages/Tags/Tags';
import { SharedWithMe } from './pages/SharedWithMe/SharedWithMe';
import { Settings } from './pages/Settings/Settings';
import { FileEditor } from './pages/FileEditor/FileEditor';
import { Trash } from './pages/Trash/Trash';
import { Profile } from './pages/Profile/Profile';
import { PublicShare } from './pages/PublicShare/PublicShare';
import { Admin } from './pages/Admin/Admin';
import { NotFound } from './pages/NotFound/NotFound';

function AppRoutes() {
  const location = useLocation();
  
  return (
    <Routes key={location.pathname}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/s/:token" element={<PublicShare />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/files"
            element={
              <ProtectedRoute>
                <Files />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recent"
            element={
              <ProtectedRoute>
                <Recent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shared"
            element={
              <ProtectedRoute>
                <Shared />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <Search />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contacts"
            element={
              <ProtectedRoute>
                <Contacts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <Notes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <Tasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gallery"
            element={
              <ProtectedRoute>
                <Gallery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/boards"
            element={
              <ProtectedRoute>
                <Boards />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activity"
            element={
              <ProtectedRoute>
                <Activity />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tags"
            element={
              <ProtectedRoute>
                <Tags />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shared-with-me"
            element={
              <ProtectedRoute>
                <SharedWithMe />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editor/:fileId"
            element={
              <ProtectedRoute>
                <FileEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trash"
            element={
              <ProtectedRoute>
                <Trash />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

