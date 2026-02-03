import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Applications from "./pages/Applications";
import AccountSelection from "./pages/steps/AccountSelection";
import PersonalBasicInfo from "./pages/steps/PersonalBasicInfo";
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

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/applications"} component={Applications} />
      <Route path={"/application/:id/step/1"} component={AccountSelection} />
      <Route path={"/application/:id/step/2"} component={AccountSelection} />
      <Route path={"/application/:id/step/3"} component={PersonalBasicInfo} />
      <Route path={"/application/:id/step/4"} component={PersonalDetailedInfo} />
      <Route path={"/application/:id/step/5"} component={OccupationInfo} />
      <Route path={"/application/:id/step/6"} component={EmploymentDetails} />
      <Route path={"/application/:id/step/7"} component={FinancialAndInvestment} />
      <Route path={"/application/:id/step/8"} component={RiskQuestionnaire} />
      <Route path={"/application/:id/step/9"} component={BankAccount} />
      <Route path={"/application/:id/step/10"} component={TaxInfo} />
      <Route path={"/application/:id/step/11"} component={DocumentUpload} />
      <Route path={"/application/:id/step/12"} component={FaceVerification} />
      <Route path={"/application/:id/step/13"} component={RegulatoryDeclaration} />
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
