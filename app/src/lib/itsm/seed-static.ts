import type { Agent, Article, Category, Requester, Service, SlaPolicy } from './types'
import { CURRENT_AGENT_ID } from './types'

export const AGENTS: Agent[] = [
  { id: CURRENT_AGENT_ID, name: 'You (Jordan Reyes)', email: 'jordan.reyes@meridian.io', avatarInitials: 'JR', role: 'lead' },
  { id: 'agent-2', name: 'Priya Nair', email: 'priya.nair@meridian.io', avatarInitials: 'PN', role: 'agent' },
  { id: 'agent-3', name: 'Marcus Bell', email: 'marcus.bell@meridian.io', avatarInitials: 'MB', role: 'agent' },
  { id: 'agent-4', name: 'Lena Fischer', email: 'lena.fischer@meridian.io', avatarInitials: 'LF', role: 'agent' },
  { id: 'agent-5', name: 'Diego Alvarez', email: 'diego.alvarez@meridian.io', avatarInitials: 'DA', role: 'lead' },
  { id: 'agent-6', name: 'Yuki Tanaka', email: 'yuki.tanaka@meridian.io', avatarInitials: 'YT', role: 'agent' },
  { id: 'agent-7', name: 'Sofia Rossi', email: 'sofia.rossi@meridian.io', avatarInitials: 'SR', role: 'agent' },
  { id: 'agent-8', name: 'Omar Haddad', email: 'omar.haddad@meridian.io', avatarInitials: 'OH', role: 'agent' },
]

const DEPARTMENTS = ['Finance', 'Sales', 'Engineering', 'Marketing', 'HR', 'Operations', 'Legal', 'Support']
const REQUESTER_NAMES = [
  'Amelia Ford', 'Noah Whitman', 'Ivy Chen', 'Ethan Brooks', 'Maya Patel', 'Liam Novak',
  'Zoe Carter', 'Aiden Wells', 'Nina Petrova', 'Caleb Rhodes', 'Grace Lin', 'Oscar Mendez',
  'Ruby Hayes', 'Felix Adler', 'Iris Kane', 'Leo Dvorak', 'Hazel Ortiz', 'Simon Vega',
  'Clara Boone', 'Theo Marsh', 'Vera Simmons', 'Jonas Beck',
]

export const REQUESTERS: Requester[] = REQUESTER_NAMES.map((name, i) => ({
  id: `req-${i + 1}`,
  name,
  email: `${name.toLowerCase().replace(/\s+/g, '.')}@meridian.io`,
  department: DEPARTMENTS[i % DEPARTMENTS.length],
}))

export const CATEGORIES: Category[] = [
  { id: 'cat-hardware', name: 'Hardware', icon: 'Laptop' },
  { id: 'cat-access', name: 'Access & Identity', icon: 'KeyRound' },
  { id: 'cat-software', name: 'Software', icon: 'AppWindow' },
  { id: 'cat-network', name: 'Network', icon: 'Wifi' },
  { id: 'cat-email', name: 'Email & Comms', icon: 'Mail' },
  { id: 'cat-onboarding', name: 'Onboarding', icon: 'UserPlus' },
]

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name)

export const SLA_POLICIES: SlaPolicy[] = [
  { id: 'sla-critical', name: 'Critical — 4h', priority: 'critical', responseMins: 15, resolutionMins: 240 },
  { id: 'sla-high', name: 'High — 8h', priority: 'high', responseMins: 30, resolutionMins: 480 },
  { id: 'sla-medium', name: 'Medium — 24h', priority: 'medium', responseMins: 120, resolutionMins: 1440 },
  { id: 'sla-low', name: 'Low — 72h', priority: 'low', responseMins: 480, resolutionMins: 4320 },
]

export const SLA_BY_PRIORITY: Record<string, string> = {
  critical: 'sla-critical',
  high: 'sla-high',
  medium: 'sla-medium',
  low: 'sla-low',
}

export const SERVICES: Service[] = [
  { id: 'svc-laptop', name: 'New laptop', description: 'Request a standard-issue laptop for a new or existing employee.', categoryId: 'cat-hardware', icon: 'Laptop', fulfillmentTime: '2–3 business days', subjectTemplate: 'New laptop request' },
  { id: 'svc-monitor', name: 'Additional monitor', description: 'Order an extra external display for your workstation.', categoryId: 'cat-hardware', icon: 'Monitor', fulfillmentTime: '1–2 business days', subjectTemplate: 'Additional monitor request' },
  { id: 'svc-peripheral', name: 'Keyboard / mouse', description: 'Replacement or ergonomic peripherals.', categoryId: 'cat-hardware', icon: 'Keyboard', fulfillmentTime: '1 business day', subjectTemplate: 'Peripheral request' },
  { id: 'svc-vpn', name: 'VPN access', description: 'Grant remote VPN access to internal systems.', categoryId: 'cat-access', icon: 'ShieldCheck', fulfillmentTime: 'Same day', subjectTemplate: 'VPN access request' },
  { id: 'svc-groupaccess', name: 'Group / folder access', description: 'Request access to a shared drive or security group.', categoryId: 'cat-access', icon: 'Users', fulfillmentTime: 'Same day', subjectTemplate: 'Access request' },
  { id: 'svc-password', name: 'Password reset', description: 'Reset a forgotten domain or app password.', categoryId: 'cat-access', icon: 'KeyRound', fulfillmentTime: '< 1 hour', subjectTemplate: 'Password reset' },
  { id: 'svc-adobe', name: 'Adobe Creative Cloud', description: 'License for the Adobe design suite.', categoryId: 'cat-software', icon: 'Palette', fulfillmentTime: '1 business day', subjectTemplate: 'Adobe Creative Cloud license' },
  { id: 'svc-office', name: 'Office 365 license', description: 'Assign an Office 365 seat.', categoryId: 'cat-software', icon: 'FileText', fulfillmentTime: 'Same day', subjectTemplate: 'Office 365 license' },
  { id: 'svc-install', name: 'Software install', description: 'Install approved software on your machine.', categoryId: 'cat-software', icon: 'Download', fulfillmentTime: '1 business day', subjectTemplate: 'Software install request' },
  { id: 'svc-wifi', name: 'Guest Wi-Fi', description: 'Temporary guest network credentials.', categoryId: 'cat-network', icon: 'Wifi', fulfillmentTime: '< 1 hour', subjectTemplate: 'Guest Wi-Fi request' },
  { id: 'svc-distro', name: 'Distribution list', description: 'Create or join an email distribution list.', categoryId: 'cat-email', icon: 'Mail', fulfillmentTime: 'Same day', subjectTemplate: 'Distribution list request' },
  { id: 'svc-onboard', name: 'New hire onboarding', description: 'Full IT setup for a new employee: accounts, hardware, access.', categoryId: 'cat-onboarding', icon: 'UserPlus', fulfillmentTime: '3–5 business days', subjectTemplate: 'New hire onboarding' },
]

export const ARTICLES: Article[] = [
  { id: 'kb-1', title: 'How to reset your domain password', category: 'Access & Identity', tags: ['password', 'account', 'security'], updatedAt: '2026-06-30T10:00:00.000Z', relatedIds: ['kb-2', 'kb-9'], body: 'If you have forgotten your domain password, you can reset it from the self-service portal.\n\nNavigate to portal.meridian.io/reset and enter your corporate email address. You will receive a one-time code by SMS to your registered device. Enter the code, then choose a new password that meets the complexity policy: at least 12 characters, one uppercase letter, one number, and one symbol.\n\nIf you do not have a registered device, contact the service desk to verify your identity. Passwords expire every 90 days; you will be prompted to change yours before expiry.' },
  { id: 'kb-2', title: 'Setting up multi-factor authentication', category: 'Access & Identity', tags: ['mfa', 'security', 'account'], updatedAt: '2026-06-28T09:00:00.000Z', relatedIds: ['kb-1'], body: 'Multi-factor authentication (MFA) adds a second layer of protection to your account.\n\nInstall the Meridian Authenticator app from your device app store. Sign in to the security portal, choose "Add MFA method", and scan the QR code with the app. Enter the six-digit code to confirm.\n\nWe recommend registering a backup method such as SMS in case you lose your device. MFA is required for all VPN and email access outside the office network.' },
  { id: 'kb-3', title: 'Connecting to the corporate VPN', category: 'Network', tags: ['vpn', 'remote', 'network'], updatedAt: '2026-06-25T14:00:00.000Z', relatedIds: ['kb-2', 'kb-8'], body: 'The corporate VPN lets you access internal systems securely from anywhere.\n\nDownload the Meridian VPN client from the software portal. Sign in with your domain credentials and complete MFA. Select the nearest gateway for best performance.\n\nIf the connection drops repeatedly, switch from the automatic protocol to TCP in the client settings. VPN access must be requested through the service catalog before first use.' },
  { id: 'kb-4', title: 'Requesting a new laptop', category: 'Hardware', tags: ['laptop', 'hardware', 'request'], updatedAt: '2026-06-20T11:00:00.000Z', relatedIds: ['kb-12'], body: 'New laptops are provisioned through the service catalog.\n\nOpen the catalog, choose "New laptop", and specify whether you need a standard or performance model. Standard laptops ship within 2–3 business days; performance models require manager approval.\n\nYour device arrives pre-imaged with the standard software set. On first boot, sign in with your domain account to complete enrollment.' },
  { id: 'kb-5', title: 'Fixing common email sync issues', category: 'Email & Comms', tags: ['email', 'outlook', 'sync'], updatedAt: '2026-06-18T08:30:00.000Z', relatedIds: ['kb-6'], body: 'If your mailbox stops syncing, try these steps in order.\n\nFirst, confirm you are online and can reach other sites. Restart the mail client fully. If the issue persists, remove and re-add the account using auto-discover.\n\nLarge mailboxes can slow sync; archive older items to a local folder. If none of this helps, the server-side cache may need clearing — open a ticket and we will reset it.' },
  { id: 'kb-6', title: 'Creating an email distribution list', category: 'Email & Comms', tags: ['email', 'distribution', 'groups'], updatedAt: '2026-06-15T13:00:00.000Z', relatedIds: ['kb-5'], body: 'Distribution lists let you email a group with a single address.\n\nSubmit a request through the service catalog with the proposed list name and initial members. Lists follow the naming convention dept-purpose@meridian.io.\n\nOwners can add or remove members from the portal after creation. Lists inactive for 12 months are automatically archived.' },
  { id: 'kb-7', title: 'Installing approved software', category: 'Software', tags: ['software', 'install', 'catalog'], updatedAt: '2026-06-12T10:00:00.000Z', relatedIds: ['kb-4'], body: 'Approved software is available from the self-service software portal.\n\nOpen the portal, search for the application, and click Install. Installations run in the background and require no admin rights.\n\nSoftware not in the catalog needs a security review. Submit a request with the vendor, version, and business justification.' },
  { id: 'kb-8', title: 'Troubleshooting Wi-Fi connectivity', category: 'Network', tags: ['wifi', 'network', 'connectivity'], updatedAt: '2026-06-10T09:00:00.000Z', relatedIds: ['kb-3'], body: 'Wi-Fi drops are usually resolved by re-authenticating.\n\nForget the Meridian-Corp network and reconnect using your domain credentials. Ensure your device clock is correct — certificate errors often trace to clock drift.\n\nIn dense areas, switch to the 5GHz band. Persistent issues in a specific room may indicate an access-point fault; report the location so facilities can investigate.' },
  { id: 'kb-9', title: 'Account locked out — what to do', category: 'Access & Identity', tags: ['account', 'lockout', 'password'], updatedAt: '2026-06-08T15:00:00.000Z', relatedIds: ['kb-1'], body: 'Accounts lock after five failed sign-in attempts to protect against attacks.\n\nWait 15 minutes and try again with the correct password. If you are still locked out, use the self-service portal to reset, which also clears the lock.\n\nRepeated lockouts often mean a saved password on another device is wrong — check your phone mail app and VPN client.' },
  { id: 'kb-10', title: 'Onboarding a new team member', category: 'Onboarding', tags: ['onboarding', 'new hire', 'setup'], updatedAt: '2026-06-05T12:00:00.000Z', relatedIds: ['kb-4', 'kb-11'], body: 'Managers should request onboarding at least five business days before a start date.\n\nSubmit the onboarding service request with the new hire\'s name, role, start date, and manager. IT provisions accounts, hardware, and baseline access ahead of day one.\n\nOn the first day, the new hire signs in to activate their account and completes MFA enrollment. Additional access is requested as needed.' },
  { id: 'kb-11', title: 'Standard software set explained', category: 'Software', tags: ['software', 'onboarding', 'standard'], updatedAt: '2026-06-02T11:00:00.000Z', relatedIds: ['kb-10'], body: 'Every managed device ships with a standard software set.\n\nThis includes the browser, office suite, mail client, VPN, and security agent. The set is maintained centrally and updated automatically.\n\nRole-specific tools — design, development, or analytics suites — are added on request through the catalog after your device is enrolled.' },
  { id: 'kb-12', title: 'Requesting an additional monitor', category: 'Hardware', tags: ['monitor', 'hardware', 'ergonomics'], updatedAt: '2026-05-30T10:00:00.000Z', relatedIds: ['kb-4'], body: 'A second monitor is available to all staff through the catalog.\n\nChoose "Additional monitor" and select your preferred size. Standard 24-inch displays ship within 1–2 business days; larger or ultrawide displays may require manager approval.\n\nMonitors come with the correct cable for your laptop. If you need a docking station, request it in the same ticket.' },
  { id: 'kb-13', title: 'Using the guest Wi-Fi network', category: 'Network', tags: ['wifi', 'guest', 'visitors'], updatedAt: '2026-05-28T14:00:00.000Z', relatedIds: ['kb-8'], body: 'Guest Wi-Fi provides internet access for visitors without corporate credentials.\n\nRequest temporary credentials from the catalog, valid for up to 24 hours. Guests connect to Meridian-Guest and enter the code on the captive portal.\n\nThe guest network is isolated from internal systems. For longer visits or contractor access, request a sponsored account instead.' },
  { id: 'kb-14', title: 'Encrypting files before sharing', category: 'Software', tags: ['security', 'encryption', 'files'], updatedAt: '2026-05-25T09:30:00.000Z', relatedIds: ['kb-7'], body: 'Sensitive files should be encrypted before sharing externally.\n\nUse the built-in file protection tool: right-click the file, choose "Protect", and set an access policy. Recipients authenticate with their email to open it.\n\nNever share confidential data over unmanaged channels. When in doubt, classify the document and let the policy decide the controls.' },
  { id: 'kb-15', title: 'Reporting a security incident', category: 'Access & Identity', tags: ['security', 'incident', 'phishing'], updatedAt: '2026-05-22T08:00:00.000Z', relatedIds: ['kb-2', 'kb-9'], body: 'Report suspected security incidents immediately — speed limits damage.\n\nFor a suspicious email, use the "Report phishing" button in your mail client; do not click links or open attachments. For a lost device or suspected breach, call the service desk directly.\n\nAfter reporting, change your password and review recent account activity in the security portal. The security team will follow up with next steps.' },
]
