/**
 * Lucide → Heroicons mapping
 * Heroicons uses: 24/outline (default), 24/solid, 20/solid (mini)
 * Import from: @heroicons/react/24/outline or @heroicons/react/24/solid
 */

// Format: 'LucideImportName': 'HeroiconsImportName'
// All from @heroicons/react/24/outline unless noted
const MAP = {
  'AlertCircle': 'ExclamationCircleIcon',
  'AlertTriangle': 'ExclamationTriangleIcon',
  'ArrowLeft': 'ArrowLeftIcon',
  'ArrowRight': 'ArrowRightIcon',
  'Bell': 'BellIcon',
  'BookOpen': 'BookOpenIcon',
  'Brain': null, // Custom PillarIcon — already replaced
  'Bug': 'BugAntIcon',
  'Calendar': 'CalendarIcon',
  'Camera': 'CameraIcon',
  'Check': 'CheckIcon',
  'CheckCircle': 'CheckCircleIcon',
  'CheckCircle2': 'CheckCircleIcon',
  'ChevronDown': 'ChevronDownIcon',
  'ChevronLeft': 'ChevronLeftIcon',
  'ChevronRight': 'ChevronRightIcon',
  'ChevronUp': 'ChevronUpIcon',
  'ChevronsUpDown': 'ChevronUpDownIcon',
  'Circle': 'StopIcon', // closest match — outlined circle
  'ClipboardCheck': 'ClipboardDocumentCheckIcon',
  'ClipboardList': 'ClipboardDocumentListIcon',
  'Clock': 'ClockIcon',
  'Compass': null, // Custom PillarIcon
  'CreditCard': 'CreditCardIcon',
  'Crown': 'TrophyIcon', // no crown in heroicons
  'ExternalLink': 'ArrowTopRightOnSquareIcon',
  'Eye': 'EyeIcon',
  'EyeOff': 'EyeSlashIcon',
  'FileQuestion': 'DocumentMagnifyingGlassIcon',
  'Flag': 'FlagIcon',
  'Flame': 'FireIcon',
  'Globe': 'GlobeAltIcon',
  'GraduationCap': 'AcademicCapIcon',
  'Heart': null, // Custom PillarIcon for physical, but also used elsewhere
  'HelpCircle': 'QuestionMarkCircleIcon',
  'Home': 'HomeIcon',
  'ImagePlus': 'PhotoIcon',
  'Inbox': 'InboxIcon',
  'Info': 'InformationCircleIcon',
  'Library': 'BuildingLibraryIcon',
  'ListChecks': 'ListBulletIcon',
  'Loader2': 'ArrowPathIcon', // spinner — needs className="animate-spin"
  'Lock': 'LockClosedIcon',
  'LogIn': 'ArrowRightOnRectangleIcon',
  'LogOut': 'ArrowLeftOnRectangleIcon',
  'Mail': 'EnvelopeIcon',
  'Menu': 'Bars3Icon',
  'MessageCircle': 'ChatBubbleLeftIcon',
  'Moon': 'MoonIcon',
  'MoreHorizontal': 'EllipsisHorizontalIcon',
  'MoreVertical': 'EllipsisVerticalIcon',
  'Plus': 'PlusIcon',
  'RefreshCw': 'ArrowPathIcon',
  'Save': 'BookmarkIcon', // no save icon in heroicons
  'Search': 'MagnifyingGlassIcon',
  'Send': 'PaperAirplaneIcon',
  'Share2': 'ShareIcon',
  'ShoppingBag': 'ShoppingBagIcon',
  'SkipForward': 'ForwardIcon',
  'Sparkles': 'SparklesIcon',
  'Star': 'StarIcon',
  'Sun': 'SunIcon',
  'Target': null, // Custom PillarIcon
  'Trash2': 'TrashIcon',
  'TrendingUp': 'ArrowTrendingUpIcon',
  'Upload': 'ArrowUpTrayIcon',
  'User': 'UserIcon',
  'UserCheck': 'UserPlusIcon', // closest
  'UserMinus': 'UserMinusIcon',
  'UserPlus': 'UserPlusIcon',
  'Users': 'UserGroupIcon',
  'Video': 'VideoCameraIcon',
  'X': 'XMarkIcon',
  'Zap': 'BoltIcon',
}

console.log(JSON.stringify(MAP, null, 2))
