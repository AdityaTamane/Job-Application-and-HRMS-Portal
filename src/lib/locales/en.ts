// English source strings. Keys are dot-namespaced by surface. This is also the
// fallback dictionary, so every key the app uses should exist here.

export const en: Record<string, string> = {
  // -- Language switcher ----------------------------------------------------
  'lang.label': 'Language',
  'lang.english': 'English',
  'lang.hindi': 'हिन्दी',

  // -- Landing: header ------------------------------------------------------
  'landing.login': 'Log in',
  'landing.getStarted': 'Get started',

  // -- Landing: hero --------------------------------------------------------
  'landing.hero.badge': 'An NGO initiative · Verified local talent',
  'landing.hero.title': 'Trusted help from your',
  'landing.hero.titleHighlight': 'neighbourhood.',
  'landing.hero.subtitle':
    'Lighthouse trains people from underserved communities and connects them to local work — every graduate background-verified, every job safety-tracked.',
  'landing.hero.hire': 'Hire a Pro',
  'landing.hero.graduate': "I'm a graduate",
  'landing.hero.rating': '4.8 avg rating',
  'landing.hero.pros': '500+ verified pros',

  // -- Landing: modules -----------------------------------------------------
  'landing.modules.title': 'One platform, four journeys',
  'landing.modules.subtitle': 'Whether you need help, want work, or want to teach — start here.',
  'landing.module.hire.title': 'Hire a Pro',
  'landing.module.hire.desc': 'Book verified academy graduates for cleaning, repairs, tutoring & more near you.',
  'landing.module.hire.cta': 'Book a service',
  'landing.module.student.title': 'Join as a Graduate',
  'landing.module.student.desc':
    'Lighthouse Academy graduate? Register, get verified, and find work in your neighbourhood.',
  'landing.module.student.cta': 'Register now',
  'landing.module.teacher.title': 'Teach with us',
  'landing.module.teacher.desc':
    'Apply to train the next batch of students. Full hiring process, transparent stages.',
  'landing.module.teacher.cta': 'Apply to teach',

  // -- Landing: trust -------------------------------------------------------
  'landing.trust.eyebrow': 'Safety first',
  'landing.trust.title': 'Verification at every step',
  'landing.trust.subtitle':
    'Documents checked by our admin team, and an AI safety gate before any pro begins work.',
  'landing.trust.liveness.label': 'AI liveness',
  'landing.trust.liveness.desc': 'On-device face check before every job',
  'landing.trust.mic.label': 'Mic consent',
  'landing.trust.mic.desc': 'Audio safety on active work',
  'landing.trust.otp.label': 'OTP verified',
  'landing.trust.otp.desc': 'Customer confirms with a code',
  'landing.trust.location.label': 'Live location',
  'landing.trust.location.desc': 'Geofenced start & live tracking',

  // -- Landing: footer ------------------------------------------------------
  'landing.footer.copyright': '© 2026 Lighthouse Academy Works · A not-for-profit initiative',
  'landing.footer.adminLogin': 'Admin / Staff login',

  // -- Login ----------------------------------------------------------------
  'login.brandTitle': 'Work that lifts communities.',
  'login.brandSubtitle': 'Sign in to book verified pros, find local work, or manage the academy.',
  'login.title': 'Log in',
  'login.subtitle': 'Welcome back to Lighthouse.',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.submit': 'Log in',
  'login.newHere': 'New here?',
  'login.createAccount': 'Create an account',
  'login.quickDemo': 'QUICK DEMO LOGIN',
  'login.applyTeach': 'Apply to teach',
  'login.reset': 'Reset demo data',
  'login.resetting': 'Resetting…',

  // -- App shell / header ---------------------------------------------------
  'app.search': 'Search…',
  'app.logout': 'Log out',
  'app.notifications': 'Notifications',
  'app.markAllRead': 'Mark all read',
  'app.noNotifications': 'No notifications',

  // -- Navigation (keyed by route path) -------------------------------------
  'nav./customer': 'Explore',
  'nav./customer/bookings': 'My Bookings',
  'nav./customer/track': 'Live Track',
  'nav./customer/wallet': 'Wallet',
  'nav./customer/profile': 'Profile',
  'nav./student': 'Dashboard',
  'nav./student/jobs': 'Find Jobs',
  'nav./student/active': 'Active Work',
  'nav./student/verification': 'Verification',
  'nav./student/skills': 'Skills & Certs',
  'nav./student/earnings': 'Earnings',
  'nav./student/wallet': 'Wallet',
  'nav./student/timeoff': 'Time Off',
  'nav./student/profile': 'Profile',
  'nav./teacher': 'Dashboard',
  'nav./teacher/openings': 'Openings',
  'nav./teacher/application': 'My Application',
  'nav./teacher/timeoff': 'Time Off',
  'nav./teacher/payslips': 'Payslips',
  'nav./teacher/profile': 'Profile',
  'nav./admin': 'Overview',
  'nav./admin/verification': 'Verification',
  'nav./admin/students': 'Students',
  'nav./admin/jobs': 'Marketplace',
  'nav./admin/hiring': 'Teacher Hiring',
  'nav./admin/incidents': 'Safety & Disputes',
  'nav./admin/requests': 'Leave & Regularization',
  'nav./admin/announcements': 'Announcements',
  'nav./admin/audit': 'Audit Log',
  'nav./hrms': 'Dashboard',
  'nav./hrms/employees': 'Employees',
  'nav./hrms/attendance': 'Attendance',
  'nav./hrms/leaves': 'Leaves',
  'nav./hrms/payroll': 'Payroll',

  // -- Nav section titles ---------------------------------------------------
  'navTitle.customer': 'Book a Pro',
  'navTitle.student': 'Student Portal',
  'navTitle.teacherCandidate': 'Teacher Careers',
  'navTitle.teacherHired': 'Lighthouse Faculty',
  'navTitle.admin': 'Lighthouse Admin',
  'navTitle.employee': 'Lighthouse HRMS',

  // -- Wallet & payments ----------------------------------------------------
  'wallet.title': 'Wallet',
  'wallet.balance': 'Available balance',
  'wallet.addFunds': 'Add money',
  'wallet.withdraw': 'Withdraw',
  'wallet.inEscrow': 'In escrow',
  'wallet.noTxns': 'No transactions yet',
  'wallet.history': 'Transaction history',
  'pay.title': 'Payment',
  'pay.payNow': 'Pay now',
  'pay.escrowNote': 'Your payment is held securely and released to the pro only after the job is completed.',
  'pay.cardNumber': 'Card number',
  'pay.expiry': 'Expiry',
  'pay.cvv': 'CVV',
  'pay.nameOnCard': 'Name on card',
  'pay.processing': 'Processing payment…',
  'pay.success': 'Payment successful',
  'pay.total': 'Total to pay',

  // -- Calls ----------------------------------------------------------------
  'call.incoming': 'Incoming call',
  'call.calling': 'Calling…',
  'call.ringing': 'Ringing…',
  'call.connected': 'Connected',
  'call.ended': 'Call ended',
  'call.accept': 'Accept',
  'call.decline': 'Decline',
  'call.mute': 'Mute',
  'call.unmute': 'Unmute',
  'call.hangUp': 'Hang up',
  'call.voiceCall': 'Voice call',
  'call.missed': 'Missed call',
  'call.unavailable': 'User is unavailable',
}
