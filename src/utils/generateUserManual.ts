import jsPDF from 'jspdf';

type UserRole = 'guest' | 'owner' | 'manager';

interface ManualSection {
  title: string;
  content: string[];
}

const guestManualSections: ManualSection[] = [
  {
    title: '1. Getting Started',
    content: [
      'Welcome to your PG Management App! This manual will guide you through all the features available to you as a guest.',
      '',
      'After logging in with your credentials, you will be directed to your dashboard where you can access all guest features.',
    ],
  },
  {
    title: '2. Dashboard Overview',
    content: [
      'Your dashboard provides a quick overview of:',
      '• Current rent status and due dates',
      '• Recent announcements from your PG',
      '• Quick access to all features',
      '',
      'The dashboard is your central hub for all activities.',
    ],
  },
  {
    title: '3. Paying Rent',
    content: [
      'To pay your monthly rent:',
      '1. Navigate to "Pay Rent" from the menu',
      '2. Select the payment month',
      '3. Choose "Manual Payment" option',
      '4. Enter the UPI transaction ID after making payment',
      '5. Upload a screenshot of your payment',
      '6. Submit for verification',
      '',
      'Your payment will be verified by the owner/manager within 24-48 hours.',
    ],
  },
  {
    title: '4. Viewing Payment History',
    content: [
      'You can view all your past payments:',
      '• Go to "Pay Rent" section',
      '• Scroll down to see payment history',
      '• Check status: Pending, Verified, or Rejected',
      '• Download receipts for verified payments',
    ],
  },
  {
    title: '5. Filing Complaints',
    content: [
      'To report an issue:',
      '1. Go to "Complaints" from the menu',
      '2. Click "New Complaint"',
      '3. Enter a title and detailed description',
      '4. Optionally upload an image',
      '5. Submit your complaint',
      '',
      'You can track the status of your complaints in the same section.',
    ],
  },
  {
    title: '6. Profile Management',
    content: [
      'Update your personal information:',
      '• Name, phone, email, emergency contact',
      '• Upload ID documents (Aadhar, PAN, etc.)',
      '• View and download your uploaded documents',
      '',
      'Keep your information up to date for better communication.',
    ],
  },
  {
    title: '7. Announcements & House Rules',
    content: [
      'Stay updated with PG announcements:',
      '• View important notices on your dashboard',
      '• Check house rules in the dashboard section',
      '• Photo gallery of your PG',
    ],
  },
  {
    title: '8. Need Help?',
    content: [
      'For any assistance:',
      '• Contact your PG owner/manager directly',
      '• Use the complaints section for maintenance issues',
      '• Check announcements for updates',
    ],
  },
];

const ownerManualSections: ManualSection[] = [
  {
    title: '1. Getting Started',
    content: [
      'Welcome to the PG Management App! This manual covers all owner features for managing your property efficiently.',
      '',
      'After logging in, you will access the owner dashboard with full control over your PG.',
    ],
  },
  {
    title: '2. Dashboard Overview',
    content: [
      'Your dashboard displays:',
      '• Total guests and occupancy rate',
      '• Monthly revenue and pending payments',
      '• Recent complaints and activities',
      '• Quick action buttons',
    ],
  },
  {
    title: '3. PG Setup',
    content: [
      'Configure your PG details:',
      '1. Go to "PG Setup" from the menu',
      '2. Enter PG name, address, and contact details',
      '3. Add house rules',
      '4. Upload PG images for guest view',
      '5. Save your settings',
    ],
  },
  {
    title: '4. Room Management',
    content: [
      'Manage rooms and beds:',
      '• Add new rooms with floor and capacity',
      '• Add multiple beds per room',
      '• Upload room images',
      '• Track occupancy status',
      '• Delete or edit room details',
    ],
  },
  {
    title: '5. Guest Management',
    content: [
      'Add and manage guests:',
      '1. Go to "Guests" section',
      '2. Click "Add Guest"',
      '3. Enter guest details (name, phone, email)',
      '4. Assign room and bed',
      '5. Set monthly rent amount',
      '',
      'You can edit, view documents, or remove guests as needed.',
    ],
  },
  {
    title: '6. Rent Tracking',
    content: [
      'Monitor rent payments:',
      '• View all guests with payment status',
      '• Filter by month, status, or guest name',
      '• Mark payments as paid manually',
      '• Generate rent reminders',
      '• Export rent data',
    ],
  },
  {
    title: '7. Payment Verification',
    content: [
      'Verify guest payments:',
      '1. Go to "Payment Verification"',
      '2. Review pending payments',
      '3. Check transaction ID and screenshot',
      '4. Approve or reject with reason',
      '',
      'Verified payments automatically update rent status.',
    ],
  },
  {
    title: '8. UPI Settings',
    content: [
      'Configure payment receiving:',
      '• Add your UPI ID',
      '• Upload UPI QR code',
      '• Set payment receiving phone number',
      '',
      'These details are shown to guests during payment.',
    ],
  },
  {
    title: '9. Expense Management',
    content: [
      'Track your expenses:',
      '• Add expenses with category and amount',
      '• Upload receipt images',
      '• Filter by month or category',
      '• View expense analytics',
    ],
  },
  {
    title: '10. Complaints Management',
    content: [
      'Handle guest complaints:',
      '• View all complaints with status',
      '• Update status (Pending/In Progress/Resolved)',
      '• Filter and sort complaints',
    ],
  },
  {
    title: '11. Announcements',
    content: [
      'Communicate with guests:',
      '• Create announcements with priority levels',
      '• Toggle announcement visibility',
      '• Edit or delete announcements',
    ],
  },
  {
    title: '12. Manager Management',
    content: [
      'Add managers to help run your PG:',
      '1. Go to "Managers" section',
      '2. Add manager with email (they must have an account)',
      '3. Set specific permissions:',
      '   - View/Manage guests, rooms, rents',
      '   - Verify payments',
      '   - Handle complaints and expenses',
      '   - View analytics',
      '',
      'Managers can only access features you permit.',
    ],
  },
  {
    title: '13. Analytics',
    content: [
      'View business insights:',
      '• Revenue trends',
      '• Occupancy rates',
      '• Expense breakdown',
      '• Payment collection rates',
    ],
  },
  {
    title: '14. Notification Settings',
    content: [
      'Configure reminders:',
      '• Enable email/SMS reminders',
      '• Set reminder days before due date',
      '• Add notification contact details',
    ],
  },
];

const managerManualSections: ManualSection[] = [
  {
    title: '1. Getting Started',
    content: [
      'Welcome! As a manager, you have been granted access to help manage a PG property.',
      '',
      'Your access is controlled by the owner who can enable or disable specific features.',
    ],
  },
  {
    title: '2. Your Permissions',
    content: [
      'The owner controls what you can access:',
      '• View permissions: See data without editing',
      '• Manage permissions: Full edit access',
      '',
      'Check with your owner about your specific permissions.',
    ],
  },
  {
    title: '3. Dashboard',
    content: [
      'Your dashboard shows:',
      '• Overview of PG statistics (if permitted)',
      '• Quick access to allowed features',
      '• Recent activities',
    ],
  },
  {
    title: '4. Guest Management',
    content: [
      'If you have guest permissions:',
      '• View guest list and details',
      '• Add/edit guests (if manage permission)',
      '• View guest documents',
      '• Assign rooms and beds',
    ],
  },
  {
    title: '5. Rent & Payments',
    content: [
      'With rent/payment permissions:',
      '• View rent status of all guests',
      '• Track payment history',
      '• Verify pending payments (if permitted)',
      '• Generate rent reminders',
    ],
  },
  {
    title: '6. Rooms Management',
    content: [
      'If you have room permissions:',
      '• View all rooms and beds',
      '• Add/edit rooms (if manage permission)',
      '• Track occupancy',
    ],
  },
  {
    title: '7. Complaints',
    content: [
      'Handle guest issues:',
      '• View submitted complaints',
      '• Update complaint status',
      '• Communicate resolutions',
    ],
  },
  {
    title: '8. Expenses',
    content: [
      'If expense permissions granted:',
      '• View expense records',
      '• Add new expenses (if permitted)',
      '• Upload receipts',
    ],
  },
  {
    title: '9. Announcements',
    content: [
      'Communicate with guests:',
      '• View announcements',
      '• Create/edit announcements (if permitted)',
      '• Set priority levels',
    ],
  },
  {
    title: '10. Best Practices',
    content: [
      '• Regularly check pending payments',
      '• Respond to complaints promptly',
      '• Keep guest information updated',
      '• Coordinate with owner for major decisions',
      '• Report any issues to the owner',
    ],
  },
];

export const generateUserManual = (role: UserRole) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  const addPage = () => {
    doc.addPage();
    yPosition = margin;
  };

  const checkPageBreak = (neededHeight: number) => {
    if (yPosition + neededHeight > pageHeight - margin) {
      addPage();
    }
  };

  // Title
  const title = role === 'guest' 
    ? 'Guest User Manual' 
    : role === 'owner' 
      ? 'Owner User Manual' 
      : 'Manager User Manual';

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('PG Management Application', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPosition += 20;

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // Get sections based on role
  const sections = role === 'guest' 
    ? guestManualSections 
    : role === 'owner' 
      ? ownerManualSections 
      : managerManualSections;

  // Render sections
  sections.forEach((section) => {
    checkPageBreak(30);

    // Section title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 33, 33);
    doc.text(section.title, margin, yPosition);
    yPosition += 10;

    // Section content
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    section.content.forEach((line) => {
      checkPageBreak(7);
      
      if (line === '') {
        yPosition += 4;
      } else {
        const lines = doc.splitTextToSize(line, contentWidth);
        lines.forEach((splitLine: string) => {
          checkPageBreak(7);
          doc.text(splitLine, margin, yPosition);
          yPosition += 6;
        });
      }
    });

    yPosition += 10;
  });

  // Footer on last page
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text(
    'This manual is for reference only. Features may vary based on updates.',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Save the PDF
  const fileName = `${role}-user-manual.pdf`;
  doc.save(fileName);
};
