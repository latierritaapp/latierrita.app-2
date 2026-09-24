import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { AuthView } from './components/AuthView';
import { LaTierritaLogo } from './components/LaTierritaLogo';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { FeedView } from './components/FeedView';
import { ExploreView } from './components/ExploreView';
import { ChatsView } from './components/ChatsView';
import { NotificationsView } from './components/NotificationsView';
import { ProfileView } from './components/ProfileView';
import { PlacesView } from './components/PlacesView';
import { StartupAdModal } from './components/StartupAdModal';
import { PlushNotificationToast } from './components/PlushNotificationToast';
import { StoryViewerModal } from './components/StoryViewerModal';
import { CreateStoryModal } from './components/CreateStoryModal';
import { CreatePostModal } from './components/CreatePostModal';
import { CreateMenuModal } from './components/CreateMenuModal';
import { EditProfileModal } from './components/EditProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { ReportModal } from './components/ReportModal';
import { StaffAdminModal } from './components/StaffAdminModal';

const AppContent: React.FC = () => {
  const { activeTab, selectedUserProfile, isStaffAdminOpen, setIsStaffAdminOpen } = useApp();

  const isAdminSlug = window.location.pathname === '/admin' || window.location.pathname === '/administracion';

  React.useEffect(() => {
    if (isAdminSlug && !isStaffAdminOpen) {
      setIsStaffAdminOpen(true);
    }
  }, [isAdminSlug, isStaffAdminOpen, setIsStaffAdminOpen]);

  if (isAdminSlug) {
    return (
      <div
        id="app-root-gradient"
        className="min-h-screen text-neutral-100 flex flex-col font-sans transition-colors duration-200 antialiased selection:bg-amber-400 selection:text-neutral-950 bg-[#001845]"
      >
        <StaffAdminModal isFullScreenRoute={true} />
        <PlushNotificationToast />
      </div>
    );
  }

  return (
    <div
      id="app-root-gradient"
      className="min-h-screen text-neutral-100 flex flex-col font-sans transition-colors duration-200 antialiased selection:bg-amber-400 selection:text-neutral-950"
    >
      {/* 1. Global Navigation Bar */}
      <Navbar />

      {/* 2. Main Tab Content */}
      <main
        className={`flex-1 w-full max-w-2xl mx-auto bg-slate-950/30 shadow-2xl border-x border-white/10 ${
          activeTab === 'chats'
            ? 'p-0'
            : 'pb-20'
        }`}
      >
        {activeTab === 'feed' && <FeedView />}
        {activeTab === 'explore' && <ExploreView />}
        {activeTab === 'chats' && <ChatsView />}
        {activeTab === 'notifications' && <NotificationsView />}
        {activeTab === 'profile' && (
          <ProfileView userToDisplay={selectedUserProfile} />
        )}
        {activeTab === 'places' && <PlacesView />}
      </main>

      {/* 3. Bottom Mobile/Desktop Navigation */}
      <BottomNav />

      {/* 4. Global Modals & Notifications */}
      {/* Floating startup advertisement with quick close button (appears on app launch) */}
      <StartupAdModal />

      {/* In-app plush notification banner */}
      <PlushNotificationToast />

      {/* Instagram Story Viewer & Creator */}
      <StoryViewerModal />
      <CreateStoryModal />

      {/* Instagram Floating Create Menu */}
      <CreateMenuModal />

      {/* Instagram Post Creator */}
      <CreatePostModal />

      {/* Instagram Profile Editor */}
      <EditProfileModal />

      {/* Simplified Settings & Blocked Users */}
      <SettingsModal />

      {/* Content Moderation & Reporting System */}
      <ReportModal />

      {/* STAFF Ads Administration */}
      <StaffAdminModal />
    </div>
  );
};

const AppGate: React.FC = () => {
  const { firebaseUser, loading } = useAuth();

  if (loading) {
    return (
      <div
        id="app-auth-loading-splash"
        className="min-h-screen bg-[#001428] flex flex-col items-center justify-center text-white p-4 selection:bg-amber-400 selection:text-neutral-950"
      >
        <div className="flex flex-col items-center space-y-4 text-center">
          <LaTierritaLogo size="lg" className="h-16 sm:h-20 animate-pulse drop-shadow-2xl" />
          <div className="space-y-1">
            <h2 className="text-base font-black text-white">La Tierrita 🇪🇸🇨🇴</h2>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-300">
              <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span>Conectando comunidad...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <AuthView />;
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}
