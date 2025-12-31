import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, Users, BedDouble, IndianRupee, AlertCircle, 
  Bell, Settings, ChevronRight, ChevronLeft, Sparkles,
  Wallet, FileText, MessageSquare, Home, CheckCircle2
} from 'lucide-react';

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  tip?: string;
}

interface OnboardingTutorialProps {
  role: 'owner' | 'guest' | 'manager';
  onComplete: () => void;
}

const ownerSteps: Step[] = [
  {
    icon: <Building2 className="w-12 h-12 text-primary" />,
    title: "Welcome to PG Manager!",
    description: "Let's take a quick tour of your dashboard. This app helps you manage your PG property efficiently.",
    tip: "You can access this tutorial anytime from Settings."
  },
  {
    icon: <Home className="w-12 h-12 text-primary" />,
    title: "Set Up Your PG",
    description: "Start by adding your PG details including name, address, and contact information. You can also upload photos and set house rules.",
    tip: "Go to 'PG Setup' in the sidebar to configure your property."
  },
  {
    icon: <BedDouble className="w-12 h-12 text-primary" />,
    title: "Manage Rooms & Beds",
    description: "Add rooms with bed configurations. Track which beds are occupied and which are available for new guests.",
    tip: "Use 'Rooms' in the sidebar to add and manage your rooms."
  },
  {
    icon: <Users className="w-12 h-12 text-primary" />,
    title: "Add Your Guests",
    description: "Register guests with their details, assign them to beds, and set their monthly rent. You can also link their login account.",
    tip: "Guests can log in to see their dashboard and pay rent online."
  },
  {
    icon: <IndianRupee className="w-12 h-12 text-primary" />,
    title: "Track Rent Payments",
    description: "Monitor rent status for all guests. Generate rent records and send reminders for pending payments.",
    tip: "Use 'Rent Tracking' to see payment status at a glance."
  },
  {
    icon: <CheckCircle2 className="w-12 h-12 text-primary" />,
    title: "Verify Payments",
    description: "When guests make payments, verify them from the Payment Verification page. You'll see their UPI transaction details.",
    tip: "Set up your UPI in 'UPI Settings' to receive payments."
  },
  {
    icon: <MessageSquare className="w-12 h-12 text-primary" />,
    title: "Handle Complaints",
    description: "Guests can raise complaints through their dashboard. View and resolve them from the Complaints section.",
    tip: "Resolved complaints help maintain good tenant relationships."
  },
  {
    icon: <Bell className="w-12 h-12 text-primary" />,
    title: "Announcements & Notifications",
    description: "Post announcements for all guests. Set up notification reminders for rent due dates.",
    tip: "Keep your guests informed about maintenance, events, or rules."
  },
  {
    icon: <Sparkles className="w-12 h-12 text-primary" />,
    title: "You're All Set!",
    description: "You're ready to start managing your PG efficiently. Explore the dashboard to discover all features.",
    tip: "Add managers to help you manage your PG with custom permissions."
  }
];

const guestSteps: Step[] = [
  {
    icon: <Building2 className="w-12 h-12 text-primary" />,
    title: "Welcome to Your PG Portal!",
    description: "This is your personal dashboard to manage your stay. Let's explore what you can do here.",
    tip: "Your dashboard shows all important info at a glance."
  },
  {
    icon: <Home className="w-12 h-12 text-primary" />,
    title: "Your Room Details",
    description: "View your assigned room, bed number, and floor. You can also see photos of your room and the PG.",
    tip: "Your room info is displayed on the main dashboard."
  },
  {
    icon: <Wallet className="w-12 h-12 text-primary" />,
    title: "Pay Your Rent",
    description: "Pay your monthly rent online using UPI. Simply click 'Pay Now' and follow the payment instructions.",
    tip: "After payment, enter your transaction ID for verification."
  },
  {
    icon: <FileText className="w-12 h-12 text-primary" />,
    title: "Download Receipts",
    description: "Once your payment is verified, you can download your rent receipt as a PDF for your records.",
    tip: "Receipts are available in the 'Pay Rent' section."
  },
  {
    icon: <MessageSquare className="w-12 h-12 text-primary" />,
    title: "Raise Complaints",
    description: "Facing any issues? Raise a complaint through the Complaints section. Your PG owner will be notified.",
    tip: "Add photos to help explain maintenance issues."
  },
  {
    icon: <Bell className="w-12 h-12 text-primary" />,
    title: "Stay Updated",
    description: "Check announcements from your PG owner on the dashboard. Important notices will be highlighted.",
    tip: "High priority announcements appear at the top."
  },
  {
    icon: <Sparkles className="w-12 h-12 text-primary" />,
    title: "You're All Set!",
    description: "Enjoy your stay! If you have any questions, reach out to your PG owner through the contact details provided.",
    tip: "Download the Guest Manual from your Profile for detailed help."
  }
];

const managerSteps: Step[] = [
  {
    icon: <Building2 className="w-12 h-12 text-primary" />,
    title: "Welcome, Manager!",
    description: "You've been assigned to help manage a PG. Let's explore your dashboard and permissions.",
    tip: "Your access is based on permissions set by the owner."
  },
  {
    icon: <Users className="w-12 h-12 text-primary" />,
    title: "Manage Guests",
    description: "If permitted, you can view and manage guest information, including check-ins and contact details.",
    tip: "Add new guests or update existing guest information."
  },
  {
    icon: <BedDouble className="w-12 h-12 text-primary" />,
    title: "Room Management",
    description: "View and manage rooms and beds based on your permissions. Track occupancy status.",
    tip: "Help maintain accurate bed availability records."
  },
  {
    icon: <IndianRupee className="w-12 h-12 text-primary" />,
    title: "Rent & Payments",
    description: "Track rent payments and verify transactions if you have payment verification permissions.",
    tip: "Help the owner keep track of pending payments."
  },
  {
    icon: <MessageSquare className="w-12 h-12 text-primary" />,
    title: "Handle Complaints",
    description: "View and manage guest complaints. Help resolve issues quickly for better tenant satisfaction.",
    tip: "Mark complaints as resolved once addressed."
  },
  {
    icon: <Sparkles className="w-12 h-12 text-primary" />,
    title: "You're Ready!",
    description: "Start helping manage the PG efficiently. Contact the owner if you need additional permissions.",
    tip: "Download the Manager Manual for detailed guidelines."
  }
];

export function OnboardingTutorial({ role, onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  const steps = role === 'owner' ? ownerSteps : role === 'guest' ? guestSteps : managerSteps;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsOpen(false);
    onComplete();
  };

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            {currentStepData.icon}
          </div>
          <DialogTitle className="text-xl">{currentStepData.title}</DialogTitle>
          <DialogDescription className="text-base">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        {currentStepData.tip && (
          <div className="bg-secondary/50 rounded-xl p-4 border border-border/30">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-primary">💡 Tip:</span> {currentStepData.tip}
            </p>
          </div>
        )}

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 btn-gradient text-primary-foreground"
            >
              {currentStep === steps.length - 1 ? (
                <>Get Started</>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Skip Tutorial
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
