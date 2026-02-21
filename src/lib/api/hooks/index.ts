// Profile
export {
  profileKeys,
  useCurrentProfile,
  useUpdateProfile,
  useUploadAvatar,
} from './useProfile'

// Network
export {
  networkKeys,
  useNetwork,
  useNetworkSuggestions,
} from './useNetwork'

// Connections
export {
  connectionKeys,
  useConnections,
  usePendingConnections,
  useSendConnectionRequest,
  useAcceptConnection,
  useRejectConnection,
  useRemoveConnection,
} from './useConnections'

// Feed
export {
  feedKeys,
  useFeed,
  useInfiniteFeed,
  useCreatePost,
  useDeletePost,
  useLikePost,
  useUnlikePost,
  usePostComments,
  useAddComment,
  useDeleteComment,
  useReportPost,
} from './useFeed'

// Messages
export {
  messageKeys,
  useConversations,
  useConversationMessages,
  useSendMessage,
  useMarkMessageRead,
  useMarkConversationRead,
  useDeleteMessage,
  useReportMessage,
} from './useMessages'

// Circles
export {
  circleKeys,
  useCircles,
  useMyCircles,
  useCircle,
  useCircleMembers,
  useCirclePosts,
  useJoinCircle,
  useLeaveCircle,
  useCreateCirclePost,
} from './useCircles'

// Dashboard
export {
  dashboardKeys,
  useDashboard,
  useDashboardStats,
  useAchievements,
} from './useDashboard'

// Goals & KPIs
export {
  goalKeys,
  kpiKeys,
  useGoals,
  useGoal,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useKPIs,
  useGoalKPIs,
  useKPI,
  useKPILogs,
  useCreateKPI,
  useLogKPI,
  useDeleteKPI,
} from './useGoals'

// Action Items
export {
  actionItemKeys,
  useActionItems,
  useActionItem,
  useCreateActionItem,
  useUpdateActionItem,
  useDeleteActionItem,
  useToggleActionItem,
  type ActionItemsParams,
} from './useActionItems'

// Protocols
export {
  protocolKeys,
  // Current hooks
  useProtocols,
  useProtocol,
  useMyActiveProtocols,
  useLogProtocolProgress,
  // Legacy hooks (deprecated — see JSDoc in useProtocols.ts)
  useActiveProtocols,
  useProtocolLibrary,
  useProtocolTemplate,
  useActiveProtocolBySlug,
  useStartProtocol,
  useUpdateProtocolProgress,
  usePauseProtocol,
  useResumeProtocol,
  useAbandonProtocol,
  // Types
  type ProtocolTemplate,
  type ProtocolWeek,
  type ProtocolTask,
  type ProtocolSection,
  type ImplementationStep,
  type ImplementationGuide,
  type ProtocolStat,
  type ProtocolsByPillar,
  type LogProtocolProgressRequest,
  type ActiveProtocolsParams,
  type TrackingMethod,
  type SuccessMetric,
  type EmergencyProtocol,
} from './useProtocols'

// Experts & Coaching
export {
  expertKeys,
  coachingKeys,
  useExperts,
  useExpert,
  useExpertTestimonials,
  useExpertAvailability,
  useCoachingSessions,
  useCoachingSession,
  useBookSession,
  useCancelSession,
  useRescheduleSession,
  useSessionNotes,
  useUpdateSessionNotes,
  type ExpertsParams,
  type SessionsParams,
} from './useExperts'

// Resources
export {
  resourceKeys,
  useResources,
  useResource,
  useCoachingResources,
  type ResourcesParams,
} from './useResources'

// Programs
export {
  programKeys,
  usePrograms,
  useProgram,
  useEnrolledPrograms,
  useEnrollProgram,
  useUpdateProgramProgress,
  useSprints,
  useSprint,
  useJoinSprint,
  useSprintGoals,
  useSprintProgress,
  useUpdateSprintProgress,
  useCompleteSprintGoal,
  useProgramAssessments,
  useProgramAssessment,
  useSubmitProgramAssessment,
  useProgramAssessmentResults,
  useProgramCVCStatus,
  useProgramCohort,
  useProgramCompletion,
  useProgramApplication,
  useSubmitApplication,
  usePeerReviews,
  usePeerReview,
  useSubmitPeerReview,
  type ProgramsParams,
  type SprintsParams,
  type ReviewsParams,
} from './usePrograms'

// Assessments
export {
  assessmentKeys,
  useAssessments,
  useAssessment,
  useAssessmentQuestions,
  useAssessmentResults,
  useLatestAssessmentResult,
  useAssessmentResultById,
  useAssessmentContent,
  useSubmitAssessment,
} from './useAssessments'

// Milestones
export {
  milestoneKeys,
  useMilestones,
  useUpdateMilestoneStatus,
  type Milestone,
} from './useMilestones'

// Accountability
export {
  accountabilityKeys,
  useAccountabilityGroup,
  useMyAccountabilityGroups,
  useAllAccountabilityGroups,
  useAccountabilityGroupDetail,
  useJoinAccountabilityGroup,
  useLeaveAccountabilityGroup,
  useGroupCheckIns,
  useCreateCheckIn,
  type AccountabilityGroup,
  type AccountabilityMember,
  type CheckInRequest,
  type CheckIn,
} from './useAccountability'

// Events
export {
  eventKeys,
  pulseKeys,
  goSessionKeys,
  useEvents,
  useEvent,
  useMyEvents,
  useRegisterForEvent,
  useUnregisterFromEvent,
  useGoSessions,
  useGoSession,
  useRegisterForGoSession,
  useSessionPulse,
  useSubmitSessionPulse,
  type ClaimnEvent,
  type EventsParams,
} from './useEvents'

// Billing
export {
  billingKeys,
  useCheckout,
  useVerifyCheckout,
} from './useBilling'

// Community Questions
export {
  communityQuestionKeys,
  useCommunityQuestions,
  useQuestionDetail,
  useAskQuestion,
  type CommunityQuestion,
  type CommunityQuestionsParams,
} from './useCommunityQuestions'

// My Expert
export {
  myExpertKeys,
  useMyExpert,
  type MyExpertData,
} from './useMyExpert'

// Notifications
export {
  notificationKeys,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type Notification,
  type NotificationsResponse,
  type NotificationsParams,
} from './useNotifications'

// Onboarding
export {
  onboardingKeys,
  useOnboardingState,
  useUpdateOnboarding,
  type OnboardingStep,
  type PrimaryChallenge,
  type OnboardingState,
} from './useOnboarding'

// Journey
export {
  journeyKeys,
  useJourney,
  useUpdateJourneyFocus,
  type JourneyData,
  type JourneyMilestone,
  type SmartPrompt,
  type JourneyProtocol,
  type JourneySession,
  type JourneyFocus,
} from './useJourney'

// Interests
export {
  interestKeys,
  useInterests,
  useMyInterests,
  useUpdateMyInterests,
  useInterestGroups,
  useMyInterestGroups,
  useInterestGroup,
  useJoinInterestGroup,
  useLeaveInterestGroup,
  type Interest,
} from './useInterests'

// Journal
export {
  journalKeys,
  useJournalEntries,
  useJournalEntry,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDeleteJournalEntry,
  type JournalEntry,
  type JournalEntriesParams,
} from './useJournal'

// Settings
export {
  settingsKeys,
  useAssessmentSharing,
  useUpdateAssessmentSharing,
} from './useSettings'

// Quarterly Reviews
export {
  quarterlyReviewKeys,
  useQuarterlyReviews,
  type QuarterlyReview,
  type QuarterlyReviewsResponse,
} from './useQuarterlyReviews'

// Subscription
export {
  subscriptionKeys,
  useSubscription,
  meetsTierRequirement,
  type SubscriptionTier,
  type SubscriptionInfo,
} from './useSubscription'
