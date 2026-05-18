import React from 'react';
import { 
  Home, 
  ClipboardList, 
  Utensils, 
  Wind, 
  MapPin, 
  Sparkles, 
  ShoppingBag, 
  Shield, 
  MessageSquare, 
  Compass, 
  User, 
  Sprout, 
  BookOpen,
  Settings,
  AlertTriangle,
  Activity
} from 'lucide-react';

// Lazy loading could be done here if the app gets larger
import { HomePage } from './pages/Home';
import { QuizPage } from './pages/Quiz';
import { QuizResultsPage } from './pages/QuizResults';
import { NourishPage } from './pages/Nourish';
import { SanctuaryPage } from './pages/Sanctuary';
import { HabitatPage } from './pages/Habitat';
import { AyurWearPage } from './pages/AyurWear';
import { AyurWearDetailPage } from './pages/AyurWearDetail';
import { AivedaChatPage } from './pages/AivedaChat';
import { ResourcesPage } from './pages/Resources';
import { ProfilePage } from './pages/Profile';
import { LoginPage } from './pages/Login';
import { OnboardingPage } from './pages/Onboarding';
import { DeactivatedPage } from './pages/Deactivated';
import { ShareDesignPage } from './pages/ShareDesign';
import { MarketplacePage } from './pages/Marketplace';
import { PrithviPage } from './pages/Prithvi';
import { NeuralHubPage } from './pages/NeuralHub';
import { AdminPortalPage } from './pages/AdminPortal';
import { VendorDashboardPage } from './pages/VendorDashboard';
import { VaultPage } from './pages/Vault';
import { ConnectivityHubPage } from './pages/ConnectivityHub';
import { SettingsPage } from './pages/Settings';
import { WellnessMapPage } from './pages/WellnessMap';
import { MealPlanPage } from './pages/MealPlan';
import { NeuroInsightPage } from './pages/NeuroInsight';
import { AboutPage } from './pages/About';
import { ContactPage } from './pages/Contact';
import { TermsPage } from './pages/Terms';
import { SuccessPage } from './pages/Success';
import { CancelPage } from './pages/Cancel';
import { Store, Brain, Archive, Calendar, Info as InfoIcon, Headset, ScrollText, CheckCircle, XCircle, Cpu, Crown } from 'lucide-react';

import { SacredMembershipPage } from './pages/SacredMembership';

export interface RouteConfig {
  path: string;
  name: string;
  component: React.ComponentType;
  icon?: any;
  protected?: boolean;
  admin?: boolean;
  vendor?: boolean;
  showInNav?: boolean;
  hideBreadcrumbs?: boolean;
  badgeKey?: string;
}

export const routes: RouteConfig[] = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    icon: Home,
    showInNav: true
  },
  {
    path: '/quiz',
    name: 'Dosha Quiz',
    component: QuizPage,
    icon: ClipboardList,
    showInNav: true
  },
  {
    path: '/quiz/results',
    name: 'Analysis',
    component: QuizResultsPage,
    protected: false
  },
  {
    path: '/nourish',
    name: 'Nourish',
    component: NourishPage,
    icon: Utensils,
    showInNav: true,
    badgeKey: 'nourish'
  },
  {
    path: '/meal-plan',
    name: 'Weekly Plan',
    component: MealPlanPage,
    icon: Calendar,
    showInNav: true,
    protected: true
  },
  {
    path: '/sanctuary',
    name: 'Sanctuary',
    component: SanctuaryPage,
    icon: Wind,
    showInNav: true,
    badgeKey: 'sanctuary'
  },
  {
    path: '/habitat',
    name: 'Habitat',
    component: HabitatPage,
    icon: MapPin,
    showInNav: true,
    badgeKey: 'habitat'
  },
  {
    path: '/ayurwear',
    name: 'AyurWear',
    component: AyurWearPage,
    icon: Sparkles,
    showInNav: true,
    badgeKey: 'ayurwear'
  },
  {
    path: '/ayurwear/product/:id',
    name: 'Ornament Detail',
    component: AyurWearDetailPage,
    protected: false
  },
  {
    path: '/ayurwear/share/:uid/:designId',
    name: 'Design Share',
    component: ShareDesignPage,
    protected: false
  },
  {
    path: '/marketplace',
    name: 'Marketplace',
    component: MarketplacePage,
    icon: ShoppingBag,
    showInNav: true
  },
  {
    path: '/prithvi',
    name: 'Prithvi Garden',
    component: PrithviPage,
    icon: Sprout,
    showInNav: true,
    protected: true,
    badgeKey: 'prithvi'
  },
  {
    path: '/ayur-chat',
    name: 'AIveda Chat',
    component: AivedaChatPage,
    icon: MessageSquare,
    showInNav: true,
    protected: true
  },
  {
    path: '/neural-hub',
    name: 'Neural Hub',
    component: NeuralHubPage,
    icon: Brain,
    showInNav: true,
    protected: true,
    badgeKey: 'neuralHub'
  },
  {
    path: '/neuro-insight',
    name: 'Neuro Insight',
    component: NeuroInsightPage,
    icon: Activity,
    showInNav: true,
    protected: true,
    badgeKey: 'neuro'
  },
  {
    path: '/vault',
    name: 'Sacred Vault',
    component: VaultPage,
    icon: Archive,
    showInNav: true,
    protected: true,
    badgeKey: 'vault'
  },
  {
    path: '/resources',
    name: 'Resources',
    component: ResourcesPage,
    icon: Compass,
    showInNav: true
  },
  {
    path: '/connectivity',
    name: 'Connectivity Hub',
    component: ConnectivityHubPage,
    icon: Cpu,
    showInNav: true,
    protected: true
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfilePage,
    icon: User,
    showInNav: true,
    protected: true
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsPage,
    icon: Settings,
    showInNav: true,
    protected: true
  },
  {
    path: '/wellness-map',
    name: 'Wellness Atlas',
    component: WellnessMapPage,
    icon: Compass,
    showInNav: true,
    protected: true
  },
  {
    path: '/admin',
    name: 'Admin Portal',
    component: AdminPortalPage,
    icon: Shield,
    showInNav: true,
    admin: true
  },
  {
    path: '/vendor',
    name: 'Vendor Dashboard',
    component: VendorDashboardPage,
    icon: Store,
    showInNav: true,
    protected: true,
    vendor: true
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: OnboardingPage,
    protected: true,
    hideBreadcrumbs: true
  },
  {
    path: '/about',
    name: 'About',
    component: AboutPage,
    icon: InfoIcon,
    showInNav: false
  },
  {
    path: '/contact',
    name: 'Contact',
    component: ContactPage,
    icon: Headset,
    showInNav: false
  },
  {
    path: '/terms',
    name: 'Terms',
    component: TermsPage,
    icon: ScrollText,
    showInNav: false
  },
  {
    path: '/checkout/success',
    name: 'Manifestation Success',
    component: SuccessPage,
    icon: CheckCircle,
    showInNav: false,
    protected: true
  },
  {
    path: '/checkout/cancel',
    name: 'Manifestation Cancelled',
    component: CancelPage,
    icon: XCircle,
    showInNav: false,
    protected: true
  },
  {
    path: '/deactivated',
    name: 'Deactivated',
    component: DeactivatedPage,
    protected: true,
    hideBreadcrumbs: true
  },
  {
    path: '/membership',
    name: 'Sacred Membership',
    component: SacredMembershipPage,
    icon: Crown,
    showInNav: false,
    protected: true
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    hideBreadcrumbs: true
  }
];
