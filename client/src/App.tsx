import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useParams } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Applications from "./pages/Applications";
import AccountSelection from "./pages/steps/AccountSelection";
import PersonalBasicInfo from "./pages/steps/PersonalBasicInfo";
import CorporateBasicInfo from "./pages/steps/CorporateBasicInfo";
import CorporateRelatedParties from "./pages/steps/CorporateRelatedParties";
import PersonalDetailedInfo from "./pages/steps/PersonalDetailedInfo";
import OccupationInfo from "./pages/steps/OccupationInfo";
import EmploymentDetails from "./pages/steps/EmploymentDetails";
import FinancialAndInvestment from "./pages/steps/FinancialAndInvestment";
import BankAccount from "./pages/steps/BankAccount";
import TaxInfo from "./pages/steps/TaxInfo";
import DocumentUpload from "./pages/steps/DocumentUpload";
import FaceVerification from "./pages/steps/FaceVerification";
import RegulatoryDeclaration from "./pages/steps/RegulatoryDeclaration";
import RiskQuestionnaire from "./pages/steps/RiskQuestionnaire";
import ApplicationPreview from "./pages/ApplicationPreview";
import ApproverRegister from "./pages/ApproverRegister";
import ApprovalList from "./pages/admin/ApprovalList";
import AdminHome from "./pages/admin/AdminHome";
import ApprovalDetail from "./pages/admin/ApprovalDetail";
import ApproverManagement from "./pages/admin/ApproverManagement";
import UserManagement from "./pages/admin/UserManagement";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

// 动态路由组件，根据客户类型分发步骤
function StepRouter() {
  const { id, step } = useParams<{ id: string; step: string }>();
  const applicationId = parseInt(id || "0");
  const stepNum = parseInt(step || "1");

  const { data: accountSelection, isLoading, error: accountSelectionError } = trpc.accountSelection.get.useQuery(
    { applicationId },
    { 
      enabled: !!applicationId,
      retry: 1,
    }
  );

  // Log error for debugging
  if (accountSelectionError) {
    console.error("Error fetching account selection in StepRouter:", accountSelectionError);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const customerType = accountSelection?.customerType || 'individual';

  // Step 1 始终是账号选择
  if (stepNum === 1) return <AccountSelection />;

  if (customerType === 'corporate') {
    switch (stepNum) {
      case 2: return <CorporateBasicInfo />;
      // 暂时重定向到现有组件，后续开发专属组件
      case 3: return <FinancialAndInvestment />; // 公司财务概况
      case 4: return <CorporateRelatedParties />; // 关联人士
      case 5: return <RiskQuestionnaire />;
      case 6: return <BankAccount />;
      case 7: return <TaxInfo />;
      case 8: return <DocumentUpload />;
      case 9: return <RegulatoryDeclaration />;
      default: return <NotFound />;
    }
  } else {
    // 个人开户流程 (12步)
    switch (stepNum) {
      case 2: return <PersonalBasicInfo />;
      case 3: return <PersonalDetailedInfo />;
      case 4: return <OccupationInfo />;
      case 5: return <EmploymentDetails />;
      case 6: return <FinancialAndInvestment />;
      case 7: return <RiskQuestionnaire />;
      case 8: return <BankAccount />;
      case 9: return <TaxInfo />;
      case 10: return <DocumentUpload />;
      case 11: return <FaceVerification />;
      case 12: return <RegulatoryDeclaration />;
      default: return <NotFound />;
    }
  }
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/applications"} component={Applications} />
      
      {/* 统一的步骤路由 */}
      <Route path={"/application/:id/step/:step"}>
        <StepRouter />
      </Route>

      <Route path={"/application/:id/preview"} component={ApplicationPreview} />
      <Route path={"/register/approver"} component={ApproverRegister} />
      <Route path={"/admin"} component={AdminHome} />
      <Route path={"/admin/approvals"} component={ApprovalList} />
      <Route path={"/admin/approvals/:id"} component={ApprovalDetail} />
      <Route path={"/admin/approvers"} component={ApproverManagement} />
      <Route path={"/admin/users"} component={UserManagement} />
      <Route path={"/forgot-password"} component={ForgotPassword} />
      <Route path={"/reset-password"} component={ResetPassword} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
