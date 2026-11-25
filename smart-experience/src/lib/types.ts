export type BranchId = 'al-jazzat' | 'al-tarfa'
export type Role = 'staff' | 'owner'
export type Lang = 'en' | 'ar'

export type RequestType = 'call_staff' | 'ready_to_pay'
export type RequestStatus = 'new' | 'acknowledged' | 'completed' | 'cancelled'
export interface ServiceRequest {
  id: string; ref: string; branchId: BranchId; type: RequestType
  vehicleColour: string; vehicleModel: string; zoneOrRef?: string
  status: RequestStatus; createdAt: string; ackAt?: string; doneAt?: string; handledBy?: string; deviceToken: string; demo?: boolean
}

export type FeedbackTopic = 'food' | 'taste' | 'waiting' | 'staff' | 'value'
export interface Feedback {
  id: string; clientId: string; branchId: BranchId; rating: number
  /** per-aspect scores 1..5 (optional) */
  aspects: Partial<Record<FeedbackTopic, number>>; comment: string
  urgent: boolean; status: 'new' | 'reviewed' | 'resolved'; createdAt: string; resolvedAt?: string; demo?: boolean
}

export interface Member { id: string; memberCode: string; name: string; email: string; branchId?: BranchId; createdAt: string; demo?: boolean }
export interface StampTx { id: string; memberId: string; branchId: BranchId; kind: 'stamp' | 'redeem'; stamps: number; ref: string; staffId: string; createdAt: string; demo?: boolean }

export interface Offer { id: string; title: string; description: string; image?: string; branchId: BranchId | 'all'; expiresAt: string; active: boolean; example?: boolean; createdAt: string }

export type EventKind = 'scan' | 'menu_view' | 'item_view' | 'review_click' | 'whatsapp_click' | 'wifi_view' | 'website_click'
export interface AppEvent { id: string; kind: EventKind; branchId?: BranchId; anonId: string; at: string; itemId?: string; demo?: boolean }

export interface StaffUser { id: string; name: string; email: string; role: Role; branches: BranchId[]; demoPin?: string }

export interface WifiConfig { ssid: string; password: string; security: 'WPA' | 'WEP' | 'nopass'; instructions: string }
export interface BranchConfig { name: string; phone: string; whatsapp: string; reviewUrl: string; wifi: WifiConfig }
export interface Settings {
  branches: Record<BranchId, BranchConfig>
  menuPdfUrl: string
  loyalty: { enabled: boolean; approved: boolean; stampsForReward: number; rewardName: string }
  features: { callStaff: boolean; readyToPay: boolean; feedback: boolean; loyalty: boolean; offers: boolean; wifi: boolean; whatsapp: boolean }
}

export interface DataState {
  version: number; demo: boolean
  requests: ServiceRequest[]; feedback: Feedback[]; members: Member[]; stamps: StampTx[]
  offers: Offer[]; events: AppEvent[]; staff: StaffUser[]; settings: Settings
}
