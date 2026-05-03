export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  RoleSelect: undefined;
  Login: undefined;
  SignUp: { role?: 'PARENT' | 'CAREGIVER' };
  SpecialistSignUp: undefined;
  ForgotPassword: undefined;
  ParentOnboarding: undefined;
  ParentTabs: undefined;
  GameRunner: { gameId: string };
  AutismScreener: undefined;
  CSBSScreener: undefined;
  QChatScreener: { source?: 'MCHAT' };
  CastScreener: undefined;
  OlderChildInfo: undefined;
  OlderChildArticle: undefined;
  ScreenerResults: {
    testType: 'MCHAT' | 'CSBS_ITC' | 'QCHAT10' | 'CAST';
    riskScore?: number;
    answers: Array<boolean | number>;
  };
  AIScreening: { riskLevel: string; riskScore: number };
  SubscriptionUpgrade: undefined;
  TelehealthBooking: undefined;
  SpecialistDashboard: undefined;
  TelehealthSession: { appointment?: any };
  SoapNoteGenerator: { appointment?: any; sessionNotes: string };
};
