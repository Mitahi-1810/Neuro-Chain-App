**NEUROCHAIN 3.0**

*Autism-Focused Pediatric Digital Health Platform*

Product Requirements Document \| AI Builder Edition

*Version 3.0 \| Confidential*

+-----------------------------------------------------------------------+
| **AI BUILDER DIRECTIVE**                                              |
+-----------------------------------------------------------------------+
| This document is the single source of architectural truth for the AI  |
| builder system. Every instruction herein is mandatory. The AI builder |
| MUST NOT infer, assume, add, or omit any feature beyond what is       |
| explicitly specified. If a behavior, screen, field, or flow is not    |
| described in this document, it does not exist in the product.         |
|                                                                       |
| **Scope:** Autism screening and therapy platform only. Dyslexia       |
| screening and AAC features are explicitly OUT OF SCOPE for this build |
| version.                                                              |
+-----------------------------------------------------------------------+

**1. Product Vision & Ecosystem Overview**

NeuroChain is a multi-sided digital health ecosystem purpose-built to
democratize pediatric autism care in South Asia. The platform bridges
the critical gap between parental concern and clinical intervention by
providing clinically validated autism screening, structured daily
gamified therapy grounded in Applied Behavior Analysis (ABA), and
seamless telehealth consultation --- all within a single native mobile
application for iOS and Android.

**1.1 The Three User Personas**

The system serves three distinct user personas. Each persona receives a
dedicated UI/UX experience, a constrained set of features, and a
separate data access role enforced at the PostgreSQL Row-Level Security
layer. The AI builder must never allow persona bleed --- a Parent must
never see a Specialist view and vice versa.

  -------------------- --------------------------- ---------------------------
  **Persona**          **Role Type**               **Primary Purpose**

  Parent / Guardian    B2C --- Primary User        Screen child, administer
                                                   daily therapy games, book
                                                   telehealth appointments,
                                                   purchase sensory equipment,
                                                   manage caregiver access.

  Clinical Specialist  B2B / B2HCP                 Conduct video
  (Doctor/Therapist)                               consultations, review
                                                   patient game analytics,
                                                   generate AI-assisted SOAP
                                                   notes, manage scheduling
                                                   and billing.

  Hired Caregiver /    B2C --- Delegated Access    Execute the assigned daily
  Nanny                                            therapy game schedule on
                                                   behalf of the parent.
                                                   Restricted data-entry-only
                                                   access.
  -------------------- --------------------------- ---------------------------

**1.2 Core Architectural Directives**

> **🔹 DIRECTIVE: The AI builder must implement ALL of the following
> without exception.**

  --------------------- -------------------------------------------------
  **Directive**         **Specification**

  Framework             React Native (Bare Workflow). All 60fps game
                        animations must use react-native-reanimated. No
                        Expo managed workflow.

  Offline-First Mandate The app must be FULLY functional without an
                        internet connection. Use WatermelonDB or SQLite
                        as the local device database. All user
                        interactions, game data, and assessments must
                        save locally first.

  Background Sync       Implement WorkManager (Android) and
  Engine                BackgroundTasks (iOS). Sync strategy:
                        last-write-wins conflict resolution. Sync
                        triggers on Wi-Fi reconnection. The sync_status
                        BOOLEAN field on every offline record must flip
                        from false to true upon successful server push.

  Local Storage         AES-256 encryption is MANDATORY for all data
  Encryption            stored on the device. No plaintext storage of any
                        user or child data.

  Backend Security      PostgreSQL Row-Level Security (RLS) must be
                        active on ALL tables. Data isolation between
                        different clinics, parents, and caregivers must
                        be enforced at the database layer, not the
                        application layer.

  Platform Support      iOS 14+ and Android 8.0 (API 26)+. Both platforms
                        must be feature-identical unless a directive
                        explicitly states otherwise.
  --------------------- -------------------------------------------------

> *⚠ NOTE: HIPAA compliance is non-negotiable. Implement audit logging
> on all database writes to the clinical tables (assessments,
> activities_log, clinical_soap_notes).*

**2. Monetization, Tier Gating & Payment Infrastructure**

**2.1 Payment Infrastructure Rules**

> **🔹 DIRECTIVE: These payment routing rules are absolute. Violating
> them will result in app store rejection.**

  --------------------- -------------------------------------------------
  **Product Type**      **Payment Gateway to Use**

  Monthly Software      Apple In-App Purchases (IAP) on iOS. Google Play
  Subscriptions (Tier   Billing on Android. Implement via
  upgrades)             react-native-iap or RevenueCat SDK. Receipt
                        validation must happen server-side.

  Telehealth            Stripe (international) or SSLCommerz
  Appointment Bookings  (Bangladesh). External gateway. Never route
                        through Apple/Google.

  Physical Product      Stripe or SSLCommerz. External gateway. Never
  (Sensory Toys /       route through Apple/Google.
  Equipment)            
  --------------------- -------------------------------------------------

**2.2 Subscription Tier Definitions**

The backend users table contains a tier_level ENUM field with values:
FREE, BASIC, PREMIUM. The frontend must read this value after every
authentication and conditionally render the entire UI based on the
active tier. Tier state must be cached locally and refreshed on every
app foreground event.

+-----------------------------------------------------------------------+
| **FREE TIER --- \"The Detector\" --- 0 BDT/month**                    |
+-----------------------------------------------------------------------+
| **Unlocked Features:**                                                |
|                                                                       |
| Access to the M-CHAT-R/F autism screener (age-gated 16--30 months).   |
| Access to one rotating demo therapy game per week (read-only preview, |
| no data logging). View-only access to the specialist directory (names |
| and credentials visible, booking locked).                             |
|                                                                       |
| **UI State --- Home Screen Banner (Persistent, Non-Dismissable):**    |
|                                                                       |
| *\"Unlock Daily Autism Therapy. Upgrade to Basic --- 299              |
| BDT/month.\"*                                                         |
|                                                                       |
| Banner sits at the bottom of the Home screen, above the navigation    |
| bar. Tapping the banner routes to the Subscription Upgrade screen.    |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **BASIC TIER --- \"Home Therapist\" --- 299 BDT/month**               |
+-----------------------------------------------------------------------+
| **Unlocked Features:**                                                |
|                                                                       |
| Unlocks the Daily Mission game generator (all 8 autism therapy        |
| games). Unlimited game sessions with full data logging to the         |
| activities_log table. 3 AI camera-assisted game sessions per month    |
| (uses front-facing camera for behavioral tracking). Access to the     |
| child\'s progress charts (last 7 days).                               |
|                                                                       |
| **UI State --- Home Screen:**                                         |
|                                                                       |
| Replace the upgrade banner with the \"Today\'s Plan\" carousel,       |
| showing the day\'s assigned therapy games with completion checkmarks. |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **PREMIUM TIER --- \"Clinical Bridge\" --- 799 BDT/month**            |
+-----------------------------------------------------------------------+
| **Unlocked Features:**                                                |
|                                                                       |
| Unlimited AI camera tracking in all games (30-day rolling history).   |
| Automated PDF clinical report generation (downloadable, shareable     |
| with specialists). Telehealth appointment booking with 20% discount   |
| applied at checkout. Full 30-day progress analytics with trend graphs |
| on the \"Clinical Insights\" tab. ROI calculator displayed on parent  |
| dashboard.                                                            |
|                                                                       |
| **UI State --- Home Screen:**                                         |
|                                                                       |
| A dedicated \"Clinical Insights\" tab appears in the bottom           |
| navigation bar. All charts are interactive and rendered without blur. |
+-----------------------------------------------------------------------+

**2.3 Graceful Downgrade Logic**

> **🔹 DIRECTIVE: NEVER delete user data on subscription downgrade. Data
> preservation is both a compliance requirement and a retention
> mechanism.**

  --------------------- -------------------------------------------------
  **Downgrade Event**   **System Behavior**

  PREMIUM → BASIC       tier_level set to BASIC via Apple/Google webhook.
                        AI camera data and PDF reports are preserved in
                        the database. On the Reports tab, historical AI
                        charts render with a blur overlay and a padlock
                        icon. Display prompt: \"Resubscribe to Premium to
                        view your full clinical history.\"

  BASIC → FREE          tier_level set to FREE. Game history preserved.
                        Daily Mission generator becomes locked. Today\'s
                        Plan carousel is replaced with the upgrade
                        banner. Past game data is never deleted.

  Payment Failure       Implement a 3-day grace period before downgrading
  (Grace Period)        tier. Send a push notification on day 1 and day 3
                        of the grace period.
  --------------------- -------------------------------------------------

**3. Parent Profile --- Complete Feature Specification**

This section defines every screen, field, interaction state, and data
flow for the Parent/Guardian persona across all subscription tiers. The
AI builder must implement every item in this section exactly as
described. No element may be added or removed.

**3.1 Account Creation & Authentication**

**3.1.1 Splash Screen**

Animated NeuroChain logo fades in on a white background over 1.2
seconds. After the animation completes, automatically transition to the
Welcome Screen. No skip button.

**3.1.2 Welcome Screen**

  --------------------- -------------------------------------------------
  **Element**           **Specification**

  Headline              Large centered text: \"Early Support Starts
                        Here\"

  Subheadline           Smaller text: \"Autism screening and daily
                        therapy for your child.\"

  CTA Button 1          \"Get Started\" --- Primary button (teal). Routes
                        to Sign Up screen.

  CTA Button 2          \"I Already Have an Account\" --- Text link.
                        Routes to Login screen.

  Bottom Note           Small legal text: \"Not a substitute for
                        professional diagnosis.\"
  --------------------- -------------------------------------------------

**3.1.3 Sign Up Screen**

  --------------------- -------------------------------------------------
  **Field**             **Validation**

  Full Name             Required. Min 2 characters. Max 60 characters.

  Email Address         Required. Must pass RFC 5322 email format check.
                        Must be unique in users table.

  Password              Required. Min 8 characters. Must contain at least
                        one uppercase letter and one number.

  Confirm Password      Required. Must match Password field.

  OAuth Option 1        \"Continue with Google\" button. Standard OAuth
                        2.0 flow.

  OAuth Option 2        \"Continue with Apple\" button. Required for iOS
                        App Store compliance.
  --------------------- -------------------------------------------------

> *⚠ NOTE: On successful account creation, set role = PARENT and
> tier_level = FREE in the users table. Dispatch a welcome email via the
> configured email provider.*

**3.1.4 Login Screen**

Standard email/password form. Include a \"Forgot Password?\" link that
triggers the password-reset email flow. Show/hide password toggle icon
inside the password input field.

**3.2 Child Profile Setup (Mandatory First-Run Flow)**

After first login, the parent MUST complete the child profile before
accessing any other feature. This is enforced by checking children table
for any records linked to the authenticated parent_id. If none exist,
block navigation and display the Child Profile Creation Modal.

**3.2.1 Child Profile Creation Modal**

  --------------------- -------------------------------------------------
  **Field**             **Specification**

  Child\'s First Name   Required. Text input. Max 40 characters.

  Date of Birth         Required. Date picker. Must not allow future
                        dates. Must not allow dates more than 12 years in
                        the past. This value is stored as dob (DATE) in
                        the children table and is used for ALL age-gating
                        logic.

  Gender                Required. Radio buttons: Boy / Girl / Prefer Not
                        to Say.

  Profile Photo         Camera roll picker. If provided, store as a
  (Optional)            resized JPEG (max 512x512px) in cloud storage. If
                        not provided, show a default illustrated avatar.

  Primary Concern       Required. Multi-select chips: \"Social
                        Development\", \"Communication\", \"Behavior &
                        Routine\", \"Sensory Sensitivities\", \"Motor
                        Skills\". This selection seeds the initial
                        therapy game recommendations.
  --------------------- -------------------------------------------------

> **🔹 DIRECTIVE: After saving the child profile, the system must
> automatically evaluate the child\'s age against the M-CHAT-R/F
> eligibility window (16--30 months). If eligible, immediately route to
> the Autism Screener. If not eligible, route to the Home Screen.**

**3.3 Home Screen --- All Tiers**

**3.3.1 Universal Header (All Tiers)**

The Home screen header always displays: child\'s profile photo (tappable
--- routes to child profile edit), child\'s first name, current streak
(e.g., \"Day 7 streak!\"), and a notification bell icon. The bell shows
a red dot badge when there are unread notifications.

**3.3.2 Free Tier Home Screen**

  --------------------- -------------------------------------------------
  **Screen Section**    **Content**

  Banner (Persistent)   Bottom-anchored teal banner: \"Unlock Daily
                        Autism Therapy. Upgrade to Basic --- 299
                        BDT/month.\" Tapping routes to the Subscription
                        screen.

  Quick Actions Row     Two large cards: \"Screen My Child\" (routes to
                        M-CHAT-R/F if eligible) and \"Explore Therapy
                        Games\" (shows the weekly rotating demo game in
                        preview mode with a lock icon).

  Weekly Demo Game      One game previewed per week (rotates on a fixed
                        7-day server-side schedule). Shows game
                        thumbnail, name, and a \"Preview\" button. The
                        Preview button shows a 15-second non-interactive
                        animation of the game with a \"Unlock All Games
                        --- Upgrade\" CTA overlay at the end.

  Doctor Directory      A horizontally scrollable list of specialist
  Teaser                cards showing name, credentials, and specialty.
                        All \"Book Appointment\" buttons are greyed out
                        with a lock icon and tooltip: \"Upgrade to book
                        telehealth.\"
  --------------------- -------------------------------------------------

**3.3.3 Basic Tier Home Screen**

  --------------------- -------------------------------------------------
  **Screen Section**    **Content**

  Today\'s Plan         A horizontally swipeable carousel of cards, each
  Carousel              representing a scheduled therapy game for the
                        day. Each card shows: game icon, game name,
                        target skill, estimated duration, and a large
                        \"Play\" button. Completed games show a green
                        checkmark.

  Progress Ring         A circular progress ring showing today\'s
                        completion percentage (games completed / games
                        scheduled). Animates from 0 to the current
                        percentage on screen load.

  Streak Counter        Displays the current consecutive days of at least
                        one completed game session. Shows a flame icon
                        and the number. Resets to 0 if no game is played
                        for a calendar day.

  Weekly Summary Chart  A 7-day bar chart of total game minutes played.
                        Uses the activities_log table. Data loads from
                        local cache first, then syncs with server.

  Upgrade Teaser        A subtle card at the bottom: \"Get AI-powered
                        insights. Upgrade to Premium.\" Non-intrusive.
                        Does not block any content.
  --------------------- -------------------------------------------------

**3.3.4 Premium Tier Home Screen**

  --------------------- -------------------------------------------------
  **Screen Section**    **Content**

  Everything in Basic   All Basic tier sections are present.

  Clinical Insights Tab A fifth tab appears in the bottom navigation bar:
                        \"Insights\" with a brain icon. This tab is
                        hidden for Free and Basic tiers.

  ROI Calculator Widget A card on the Home screen showing the ROI
                        formula: ROI = ((Total Telehealth Discounts
                        Earned - 799 BDT) / 799 BDT) x 100. Updates
                        dynamically as the parent books appointments.

  AI Session Badge      Next to each game in Today\'s Plan, show an \"AI
                        Active\" badge indicating the front-facing camera
                        will be used for behavioral tracking during the
                        session.
  --------------------- -------------------------------------------------

**3.4 Bottom Navigation Bar (All Tiers)**

  --------------------- -------------------------------------------------
  **Tab**               **Accessible To**

  Home (House icon)     All tiers

  Games (Controller     Basic and Premium. Locked with padlock icon on
  icon)                 Free.

  Reports (Chart icon)  Basic (last 7 days). Premium (last 30 days with
                        AI overlays). Free: locked.

  Store (Bag icon)      All tiers (physical product browsing free;
                        checkout requires account).

  Insights (Brain icon) Premium only. Hidden from navigation bar for Free
                        and Basic.
  --------------------- -------------------------------------------------

**3.5 Telehealth Booking Flow (Premium Tier)**

The booking flow is a multi-step wizard. Each step must be completed
before the next step unlocks. The wizard state must persist locally so
the parent can abandon and resume.

1.  Step 1 --- Specialist Search: Parent filters by specialty (Autism /
    Developmental Pediatrics / Speech Therapy / Occupational Therapy),
    city, and language. Results are paginated, 10 per page.

2.  Step 2 --- Specialist Profile: Full specialist card showing
    credentials, consultation fee in BDT, available time slots (pulled
    from the appointments table), and patient reviews (average star
    rating only, no free-text reviews displayed).

3.  Step 3 --- Slot Selection: Interactive calendar view. Available
    slots shown in teal. Unavailable slots greyed out. Parent selects
    one slot.

4.  Step 4 --- Payment: Stripe or SSLCommerz payment form. 20% Premium
    discount applied automatically before the payment total is shown.
    Never show the pre-discount price.

5.  Step 5 --- Confirmation Screen: Shows appointment date, time,
    specialist name, and a calendar event download button (.ics format).

> *⚠ NOTE: Upon payment confirmation, trigger the automated WhatsApp
> reminder pipeline (see Specialist section 5.1) for both the parent and
> the specialist.*

**3.6 Parent Notification System**

  --------------------- -------------------------------------------------
  **Trigger Event**     **Notification Content**

  Appointment confirmed Push notification + WhatsApp: \"Your appointment
  by doctor             with \[Specialist Name\] on \[Date\] at \[Time\]
                        is confirmed.\"

  24 hours before       Push notification + WhatsApp: \"Reminder: Your
  appointment           telehealth session is tomorrow at \[Time\]. Tap
                        to join.\"

  1 hour before         Push notification: \"Your session starts in 1
  appointment           hour. Tap to open the virtual waiting room.\"

  Daily game streak     Push notification: \"Don\'t break your streak!
  reminder (if no game  \[Child Name\]\'s therapy games are waiting.\"
  played by 6 PM)       

  Subscription expiring Push notification: \"Your Premium subscription
  in 3 days             renews in 3 days. Manage in Settings.\"
  --------------------- -------------------------------------------------

**4. Clinical Specialist Profile --- Complete Feature Specification**

Specialists (doctors, speech therapists, occupational therapists) access
an entirely separate portal at the route /specialist/dashboard. This
portal is never accessible to parent or caregiver accounts. The
specialist\'s role field in the users table must equal SPECIALIST for
access to be granted.

**4.1 Specialist Onboarding & Verification**

**4.1.1 Specialist Sign-Up Flow**

  --------------------- -------------------------------------------------
  **Field**             **Specification**

  Full Legal Name       Required.

  Medical Registration  Required. Stored as credential_id in the
  Number                specialists table. The platform must display this
                        number on the public profile but MUST NOT verify
                        it --- verification is an administrative process
                        handled outside the app.

  Specialty             Required. Dropdown: Developmental Pediatrics /
                        Autism Specialist / Child Psychiatry /
                        Speech-Language Pathology / Occupational Therapy.

  Clinic/Hospital Name  Required.

  Clinic City           Required. Text field.

  Consultation Fee      Required. Numeric field. This value is displayed
  (BDT)                 to parents during booking.

  Languages Spoken      Multi-select chips: Bengali / English / Hindi /
                        Arabic.

  Profile Photo         Required for specialists. Minimum 400x400px.
                        Stored in cloud.

  Short Bio             Optional. Max 300 characters. Displayed on public
                        profile.

  Bank Account for      Required. Stored encrypted. Never displayed in
  Payouts               plaintext in the UI.
  --------------------- -------------------------------------------------

> *⚠ NOTE: After sign-up, specialist account status is set to PENDING.
> An admin must manually set status to ACTIVE before the specialist
> appears in parent search results. Implement a simple admin flag in the
> users table: is_verified BOOLEAN.*

**4.2 Specialist Dashboard --- Overview Screen**

**4.2.1 Header KPI Bar**

At the top of the dashboard, display four KPI metric cards in a 2x2
grid:

  --------------------- -------------------------------------------------
  **Metric Card**       **Data Source**

  Total Active Patients COUNT of distinct parent_id in appointments where
                        specialist_id = current user AND status =
                        CONFIRMED or COMPLETED.

  Pending Appointment   COUNT of appointments where status = PENDING.
  Requests              

  Today\'s Schedule     COUNT of appointments where date = today AND
                        status = CONFIRMED.

  Monthly Earnings      SUM of amount_paid_bdt in appointments where
  (BDT)                 specialist_id = current user AND month = current
                        month AND status = COMPLETED.
  --------------------- -------------------------------------------------

**4.2.2 Today\'s Appointment List**

Below the KPI bar, render a chronologically sorted list of today\'s
confirmed appointments. Each appointment card contains: parent name,
child name, child age (calculated from dob), appointment time, session
type (Initial Assessment / Follow-Up), and two buttons: \"Join Call\"
(active 5 minutes before the scheduled time) and \"View Patient Data\"
(always active).

**4.3 Scheduling & Appointment Management**

**4.3.1 Calendar View**

A full-screen multi-resource calendar (week and day views). The
specialist can tap any open time slot to block it (mark unavailable).
All confirmed appointments appear as colored blocks on the calendar.
Pending requests appear as striped/dashed blocks.

**4.3.2 Pending Request Actions**

When a parent requests a slot, a card appears in the \"Pending
Requests\" queue. The specialist taps the card and sees: parent name,
child name, child age, primary concern selected during onboarding, and
the requested time. The specialist can tap \"Accept\" or \"Decline\". On
Accept, the appointment status changes to CONFIRMED and the automated
reminder pipeline triggers immediately.

> **🔹 DIRECTIVE: On Accept, the backend MUST immediately schedule two
> WhatsApp messages to the parent via the Twilio/Meta API: one 24 hours
> before the appointment and one 1 hour before.**

**4.4 Patient Clinical Data View**

**4.4.1 Patient Selection**

The specialist taps a patient\'s name from the dashboard or calendar.
This opens the Patient Clinical Dashboard --- a read-only data view. The
specialist CANNOT edit game data from this view.

**4.4.2 Patient Clinical Dashboard Layout**

  --------------------- -------------------------------------------------
  **Dashboard Panel**   **Data Displayed**

  Child Header          Child\'s first name, age, date of last session,
                        total games completed, and current streak count.

  M-CHAT-R/F Results    The original screening answers stored in
  Card                  assessments.raw_answers (JSONB), the computed
                        risk_score, and the risk_level (LOW / MODERATE /
                        HIGH). Read-only.

  Last 30 Days Activity A line chart of accuracy_percentage from
  Graph                 activities_log, one line per game_id. Rendered
                        using the Victory Native or Recharts library.
                        Date on X-axis, accuracy on Y-axis.

  Bubble Pop Analytics  Total bubbles popped, bombs hit, accuracy trend,
                        average_linger_time_ms trend. Displayed as
                        mini-stats and a 30-day sparkline.

  Waiting Game (Eye     average_time_to_eye_contact_ms trend over 30 days
  Contact) Analytics    and successful_bids per session. These are
                        AI-derived values from ai_vision_metrics (JSONB)
                        in activities_log.

  Session Notes History A scrollable list of all previously signed SOAP
                        notes for this patient. Each note is expandable.
                        Shows date, specialist name, and the four SOAP
                        fields.
  --------------------- -------------------------------------------------

**4.5 AI-Powered Telehealth Session**

**4.5.1 Virtual Waiting Room**

Five minutes before the appointment time, both the parent and the
specialist see an active \"Join Waiting Room\" button. The waiting room
is a simple screen with the other party\'s profile photo, name, and a
spinning \"Waiting for\...\" indicator. When both parties are in the
waiting room, the video call begins automatically.

**4.5.2 Video Call Interface (WebRTC)**

  --------------------- -------------------------------------------------
  **UI Element**        **Specification**

  Primary Video Feed    Parent/child video. Full screen.

  Secondary Video Feed  Specialist\'s self-view. Bottom-right corner.
  (PiP)                 Draggable.

  Microphone Toggle     Mute/unmute button. Red when muted.

  Camera Toggle         Turn camera on/off.

  End Call Button       Red circular button. Requires a confirmation
                        dialog: \"End Call? This will finalize the
                        session and begin SOAP note generation.\"

  Ambient Recording     A subtle pulsing red dot in the top-left corner
  Indicator             with text \"Session Recording --- Consent
                        Given\". This dot is only visible if the
                        specialist has enabled ambient recording and the
                        parent has provided consent during the booking
                        flow.
  --------------------- -------------------------------------------------

**4.5.3 AI SOAP Note Generation Pipeline**

> **🔹 DIRECTIVE: The AI scribe pipeline must execute in this exact
> sequence after the specialist ends the call.**

1.  End Call Trigger: Specialist confirms the end-call dialog. Session
    status updates to COMPLETED in the appointments table.

2.  Audio Submission: The recorded audio file is uploaded to the
    backend. Progress bar shown to the specialist: \"Analyzing session
    audio\...\"

3.  STT Transcription: Backend sends audio to OpenAI Whisper API.
    Returns raw text transcript.

4.  LLM Processing: Raw transcript sent to GPT-4 with the following
    exact system prompt: Parse this pediatric autism telehealth
    transcript into a strict JSON SOAP note with four keys:
    \'subjective\' (parent-reported observations, child\'s sleep and
    diet history), \'objective\' (measurable behaviors, eye contact
    quality, stimming observed during call), \'assessment\' (clinical
    interpretation of findings and progress against therapy goals),
    \'plan\' (therapy frequency, specific home-care game instructions,
    next appointment timing). Return only valid JSON. No other text.

5.  UI Rendering: The JSON response populates four editable rich-text
    boxes labeled Subjective, Objective, Assessment, and Plan. The
    specialist reviews and edits each field.

6.  Sign & Finalize: A prominently labeled \"Sign & Finalize Note\"
    button is below the four fields. Tapping it sets is_signed = true in
    clinical_soap_notes, timestamps the record, and stores the
    specialist\'s user ID as the signer. This action is irreversible and
    logged in the audit trail.

> *⚠ NOTE: The AI-generated content is explicitly labeled \"AI Draft ---
> Requires Clinical Review\" in light grey text above the four boxes.
> This disclaimer is part of the legal liability design.*

**4.6 Revenue Cycle Management & Earnings**

**4.6.1 Earnings Dashboard**

A financial overview screen accessible from the main navigation.
Displays: total earnings this month (BDT), total appointments this
month, average earnings per session, and a monthly earnings bar chart
for the last 6 months.

**4.6.2 Automated Invoicing**

Immediately after a session status changes to COMPLETED and the SOAP
note is signed, the system must automatically generate a PDF receipt and
dispatch it to the parent via WhatsApp (Twilio) and email. The PDF must
include: session date, specialist name and credentials, session
duration, amount paid, and the appointment ID as a reference number.

**4.6.3 Payout Schedule**

Display a payout history table showing all completed settlements to the
specialist\'s registered bank account. Include columns: Payout Date,
Amount (BDT), Appointments Included, and Status (Pending / Settled).

**5. Autism Screener --- M-CHAT-R/F Module**

The Modified Checklist for Autism in Toddlers, Revised with Follow-Up
(M-CHAT-R/F) is the sole diagnostic screening instrument in this
version. The AI builder must implement the screener exactly as described
--- no modifications to questions, scoring, or routing logic are
permitted.

**5.1 Age Gate**

The M-CHAT-R/F is only available for children aged 16 to 30 months
inclusive. Age is calculated from the dob field in the children table
against the current date. If the child is outside this range, the
screener option is hidden and replaced with text: \"Screening is
available for children aged 16--30 months. Check back when your child is
in this age range.\"

**5.2 Screener UI/UX Design**

> **🔹 DIRECTIVE: Do NOT render a scrolling list of questions. Use a
> paginated swipeable card deck --- one question per screen.**

  --------------------- -------------------------------------------------
  **UI Element**        **Specification**

  Card Layout           Single question centered on screen. Question
                        number shown as \"Question X of 20\" at the top.

  Question Text         Large, readable font (minimum 20pt). Dark text on
                        white card background. No clinical jargon ---
                        questions are written in plain parent-friendly
                        language.

  Answer Buttons        Two full-width buttons at the bottom: \"Yes\"
                        (green, left) and \"No\" (red, right). Buttons
                        must be large enough for one-handed tapping
                        (minimum 56dp height).

  Progress Indicator    A thin linear progress bar at the top of the
                        screen fills as the parent advances through
                        questions.

  Back Button           A small back arrow in the top-left allows
                        re-answering any previous question. Tapping back
                        navigates to the previous card.

  No Skip               There is no \"Skip\" option. Every question must
                        be answered before advancing.
  --------------------- -------------------------------------------------

**5.3 The 20 Screening Questions (Hardcoded --- Do Not Modify)**

+-----------------------------------------------------------------------+
| **M-CHAT-R/F Question Bank**                                          |
+-----------------------------------------------------------------------+
| **REVERSED questions (Yes = ASD risk): 2, 5, 12**                     |
|                                                                       |
| **STANDARD questions (No = ASD risk): all others**                    |
|                                                                       |
| -   **Q1:** If you point at something across the room, does your      |
|     child look at it?                                                 |
|                                                                       |
| ```{=html}                                                            |
| <!-- -->                                                              |
| ```                                                                   |
| -   **Q2:** Have you ever wondered if your child might be deaf?       |
|     \[REVERSED\]                                                      |
|                                                                       |
| ```{=html}                                                            |
| <!-- -->                                                              |
| ```                                                                   |
| -   **Q3:** Does your child play pretend or make-believe?             |
|                                                                       |
| ```{=html}                                                            |
| <!-- -->                                                              |
| ```                                                                   |
| -   **Q4:** Does your child like climbing on things?                  |
|                                                                       |
| ```{=html}                                                            |
| <!-- -->                                                              |
| ```                                                                   |
| -   **Q5:** Does your child make unusual finger movements near his or |
|     her eyes? \[REVERSED\]                                            |
|                                                                       |
| ```{=html}                                                            |
| <!-- -->                                                              |
| ```                                                                   |
| -   **Q6:** Does your child point with one finger to ask for          |
|     something or to get help?                                         |
|                                                                       |
| ```{=html}                                                            |
| <!-- -->                                                              |
| ```                                                                   |
| -   **Q7:** Does your child point with one finger to show you         |
|     something interesting?                                            |
|                                                                       |
| ```{=html}                                                            |
| <!-- -->                                                              |
| ```                                                                   |
| -   **Q8:** Is your child interested in other children?               |
|                                                                       |
| ```{=html}                                                            |
| <!-- -->                                                              |
| ```                                                                   |
| -   **Q9:** Does your child show you things by bringing them to you   |
|     or holding them up for you to see?                                |
|                                                                       |
| ```{=html}                                                            |
| <!-- -->                                                              |
| ```                                                                   |
| -   **Q10:** Does your child respond when you call his or her name?   |
|                                                                       |
| ```{=html}                                                            |
| <!-- -->                                                              |
| ```                                                                   |
| -   **Q11:** When you smile at your child, does he or she smile back  |
|     at you?                                                           |
|                                                                       |
| ```{=html}                                                            |
| <!-- -->                                                              |
| ```                                                                   |
| -   **Q12:** Does your child get upset by everyday noises?            |
|     \[REVERSED\]                                                      |
|                                                                       |
| ```{=html}                                                            |
| <!-- -->                                                              |
| ```                                                                   |
| -   **Q13:** Does your child walk?                                    |
|                                                                       |
| ```{=html}                                                            |
| <!-- -->                                                              |
| ```                                                                   |
| -   **Q14:** Does your child look you in the eye when you are         |
|     talking, playing, or dressing him or her?                         |
|                                                                       |
| ```{=html}                                                            |
| <!-- -->                                                              |
| ```                                                                   |
| -   **Q15:** Does your child try to copy what you do?                 |
|                                                                       |
| ```{=html}                                                            |
| <!-- -->                                                              |
| ```                                                                   |
| -   **Q16:** If you turn your head to look at something, does your    |
|     child look around to see what you are looking at?                 |
|                                                                       |
| ```{=html}                                                            |
| <!-- -->                                                              |
| ```                                                                   |
| -   **Q17:** Does your child try to get you to watch him or her?      |
|                                                                       |
| ```{=html}                                                            |
| <!-- -->                                                              |
| ```                                                                   |
| -   **Q18:** Does your child understand when you tell him or her to   |
|     do something?                                                     |
|                                                                       |
| ```{=html}                                                            |
| <!-- -->                                                              |
| ```                                                                   |
| -   **Q19:** If something new happens, does your child look at your   |
|     face to see how you feel about it?                                |
|                                                                       |
| ```{=html}                                                            |
| <!-- -->                                                              |
| ```                                                                   |
| -   **Q20:** Does your child like movement activities?                |
+-----------------------------------------------------------------------+

**5.4 Scoring Logic & Post-Screen Routing**

After all 20 questions are answered, the system calculates the risk
score as follows:

+-----------------------------------------------------------------------+
| **Scoring Algorithm**                                                 |
+-----------------------------------------------------------------------+
| **Reversed Questions (2, 5, 12):** A \"Yes\" answer scores 1 point    |
| (ASD risk indicator).                                                 |
|                                                                       |
| **All Other Questions:** A \"No\" answer scores 1 point (ASD risk     |
| indicator).                                                           |
|                                                                       |
| **Total Score:** Sum all risk points. Range: 0--20.                   |
|                                                                       |
|   ------------------- ----------------------------------------------  |
|   **Score Range**     **Risk Level & Action**                         |
|                                                                       |
|   0 -- 2 (Low Risk)   Route to Free Tier Home Screen. Play a          |
|                       full-screen confetti animation for 2 seconds.   |
|                       Show message: \"Great news! Based on your       |
|                       responses, your child shows low indicators at   |
|                       this time. Continue monitoring development.\"   |
|                                                                       |
|   3 -- 7 (Moderate    Route to Upgrade Screen. Message: \"Some        |
|   Risk)               responses suggest it may be helpful to monitor  |
|                       your child\'s development closely. We           |
|                       recommend daily therapy activities.\"           |
|                       Prominently display the 299 BDT Basic Tier      |
|                       card.                                           |
|                                                                       |
|   8 -- 20 (High Risk) Route to Telehealth Booking Screen. Urgent but  |
|                       calm messaging: \"Your responses suggest your   |
|                       child may benefit from a specialist             |
|                       evaluation. Please consider booking an          |
|                       appointment with a developmental                |
|                       pediatrician.\" Prominently display the 799     |
|                       BDT Premium Tier card.                          |
|   ------------------- ----------------------------------------------  |
+-----------------------------------------------------------------------+

> **🔹 DIRECTIVE: Store the full assessment in the assessments table:
> test_type = \'MCHAT\', raw_answers (JSONB array of 20 boolean values),
> risk_score (INTEGER), risk_level (ENUM).**

**6. Autism Therapy Games --- Clinical Design & Implementation**

All eight games in this section are grounded in Applied Behavior
Analysis (ABA) methodology and evidence-based autism intervention
practices. Each game targets one or more core developmental areas
commonly affected in autism spectrum disorder. The AI builder must
implement all eight games with the exact mechanics, data schemas, and
progression algorithms described below.

**6.1 Universal Game Engine Rules**

> **🔹 DIRECTIVE: These rules apply to EVERY game without exception. No
> game may deviate from these rules.**

  --------------------- -------------------------------------------------
  **Rule**              **Specification**

  Screen Orientation    Force-lock to Landscape mode on game start.
                        Unlock on game exit.

  Distraction-Free UI   Remove all navigation bars, status bars,
                        notification overlays, and app menus during
                        gameplay. Only the game elements and a single
                        muted \"X\" exit button in the top-left corner
                        are visible.

  Exit Confirmation     Tapping \"X\" shows a dialog: \"Exit game? Your
                        progress will be saved.\" Two options: \"Keep
                        Playing\" and \"Exit.\"

  Offline Data Storage  All game data is written to activities_log in the
                        local database immediately upon session end. The
                        sync_status field is set to false. The background
                        sync engine updates it to true when the device is
                        online.

  AI Camera (Premium    On game start for Premium accounts, quietly
  Only)                 activate the front-facing camera. Do NOT show the
                        camera preview to the child. Capture frames at
                        10fps. Stream via WebSockets to the Python
                        backend running MediaPipe for gaze tracking and
                        facial affect recognition. Store results in
                        ai_vision_metrics (JSONB).

  Age Appropriateness   All game visuals, characters, and audio use
                        bright primary colors, simple rounded shapes, and
                        a friendly non-threatening art style. No
                        realistic violence, darkness, or complex abstract
                        imagery.

  Reward Animations     Every correct action triggers an immediate,
                        joyful reward animation (confetti, bouncing
                        stars, character celebration). Reward animation
                        must complete within 600ms to maintain
                        engagement.
  --------------------- -------------------------------------------------

**6.2 The Eight Therapy Games**

+-----------------------------------------------------------------------+
| **Game 1: \"Bubble Pop\"** *\[Basic + Premium\]*                      |
|                                                                       |
| **Clinical Goal:** Visual-motor integration and fine motor control.   |
| Early motor impairments and visual tracking deficits are core         |
| features of ASD. This game assesses and builds visual-motor           |
| coordination.                                                         |
|                                                                       |
| **ABA Target:** Fine Motor Skill Development / Visual Tracking /      |
| Sustained Attention                                                   |
|                                                                       |
| **[Mechanics]{.underline}**                                           |
|                                                                       |
| -   Colorful soap bubbles float upward from the bottom of the screen  |
|     in gentle arcs.                                                   |
|                                                                       |
| -   The child must tap each bubble before it exits the top of the     |
|     screen to pop it.                                                 |
|                                                                       |
| -   Obstacles: Red bomb objects and orange fireballs appear at        |
|     increasing frequency. Tapping an obstacle deducts one life.       |
|                                                                       |
| -   Session parameters: 90-second countdown timer. Child has 3 lives  |
|     per level. A life indicator (3 heart icons) is displayed in the   |
|     top-right corner.                                                 |
|                                                                       |
| -   Popping bubbles awards points displayed as a running score in the |
|     top-center.                                                       |
|                                                                       |
| -   On level completion (90 seconds elapsed): display score,          |
|     accuracy, and a star rating (1--3 stars based on accuracy).       |
|                                                                       |
| **[Data Logged to Database]{.underline}**                             |
|                                                                       |
| -   total_popped (INTEGER): Total bubbles successfully tapped.        |
|                                                                       |
| -   bombs_hit (INTEGER): Total obstacles accidentally tapped.         |
|                                                                       |
| -   accuracy_percentage (DECIMAL): total_popped / (total_popped +     |
|     bombs_hit) \* 100.                                                |
|                                                                       |
| -   average_linger_time_ms (INTEGER): Average duration in             |
|     milliseconds that the child\'s finger rested on the screen per    |
|     tap.                                                              |
|                                                                       |
| -   session_duration_seconds (INTEGER): Actual time from game start   |
|     to game end.                                                      |
|                                                                       |
| -   level_reached (INTEGER): The level number the child was on when   |
|     the session ended.                                                |
|                                                                       |
| **[Progression Algorithm]{.underline}**                               |
|                                                                       |
| -   Level 1: 8 bubbles on screen at once, slow straight upward paths. |
|     No obstacles.                                                     |
|                                                                       |
| -   Level 2: 10 bubbles, slight curved paths. 2 bombs introduced.     |
|                                                                       |
| -   Progression Trigger: If accuracy_percentage \> 80% at end of      |
|     level, next level increases bubble count by 2 and makes paths     |
|     erratic (random bezier curves). Obstacle frequency increases by 1 |
|     per level.                                                        |
|                                                                       |
| -   Regression Trigger: If accuracy_percentage \< 40% at end of       |
|     level, reduce bubble count by 1 and slow movement speed. Never    |
|     regress below Level 1 parameters.                                 |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **Game 2: \"The Waiting Game\"** *\[Premium Only (AI Camera           |
| Required)\]*                                                          |
|                                                                       |
| **Clinical Goal:** Joint attention and voluntary eye contact. Joint   |
| attention --- the ability to share focus on an object or event with   |
| another person --- is one of the earliest and most significant        |
| deficits in ASD. This game uses verified gaze detection to teach the  |
| child that eye contact produces rewarding outcomes.                   |
|                                                                       |
| **ABA Target:** Joint Attention / Eye Contact / Cause-and-Effect      |
| Understanding                                                         |
|                                                                       |
| **[Mechanics]{.underline}**                                           |
|                                                                       |
| -   Screen displays a visually desirable animated object (e.g., a     |
|     race car on a track, a rocket on a launchpad, a train at a        |
|     station). The object is FROZEN --- it does not move.              |
|                                                                       |
| -   Audio prompt plays: \"Ready\... Set\...\" then pauses. The object |
|     quivers slightly to signal it wants to move.                      |
|                                                                       |
| -   The AI camera monitors the child\'s gaze. The object will NOT     |
|     move until the MediaPipe gaze model detects that the child is     |
|     looking directly at the device screen for a continuous, unbroken  |
|     1.5 seconds.                                                      |
|                                                                       |
| -   On gaze detection: the app plays an exciting audio cue (\"GO!\")  |
|     and the object animates in a dramatic, rewarding sequence (car    |
|     zooms, rocket launches, train speeds away with particle effects). |
|                                                                       |
| -   After the reward animation completes (approximately 3 seconds),   |
|     the object resets to its frozen starting position and the cycle   |
|     repeats.                                                          |
|                                                                       |
| -   Each session consists of 10 bid cycles. Session ends after 10     |
|     successful or attempted cycles.                                   |
|                                                                       |
| **[Data Logged to Database]{.underline}**                             |
|                                                                       |
| -   average_time_to_eye_contact_ms (INTEGER): Average milliseconds    |
|     from audio prompt to verified 1.5-second gaze. Stored in          |
|     ai_vision_metrics JSONB.                                          |
|                                                                       |
| -   successful_bids (INTEGER): Number of cycles where the child       |
|     achieved the 1.5-second gaze threshold.                           |
|                                                                       |
| -   total_bids (INTEGER): Total cycles attempted in the session (max  |
|     10).                                                              |
|                                                                       |
| -   bid_latencies_array (JSONB): Array of 10 individual latency       |
|     values in milliseconds for granular clinical analysis.            |
|                                                                       |
| **[Progression Algorithm]{.underline}**                               |
|                                                                       |
| -   Baseline: 1.5-second sustained gaze required. 10 cycles per       |
|     session.                                                          |
|                                                                       |
| -   Progression: After 3 consecutive sessions with successful_bids    |
|     \>= 8, increase required gaze duration to 2.0 seconds.            |
|                                                                       |
| -   Clinical Note: The trend of average_time_to_eye_contact_ms over   |
|     weeks is the primary progress metric for the specialist\'s        |
|     clinical dashboard.                                               |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **Game 3: \"Emotion Mirror\"** *\[Basic + Premium\]*                  |
|                                                                       |
| **Clinical Goal:** Facial expression recognition and social           |
| referencing. Children with ASD frequently struggle to identify and    |
| interpret facial expressions, which is foundational to all social     |
| interaction. This game builds emotional literacy through structured,  |
| repeated exposure to facial emotion categories.                       |
|                                                                       |
| **ABA Target:** Emotion Recognition / Social Referencing / Affect     |
| Labeling                                                              |
|                                                                       |
| **[Mechanics]{.underline}**                                           |
|                                                                       |
| -   Screen displays a large, animated character face showing a clear, |
|     exaggerated facial expression (Happy, Sad, Angry, Surprised,      |
|     Scared, Disgusted). Only the 6 basic emotion categories are used. |
|                                                                       |
| -   Below the face, 4 emotion label buttons appear (one correct,      |
|     three distractors from the same set).                             |
|                                                                       |
| -   Audio prompt: \"How is this friend feeling?\" The character\'s    |
|     expression animates gently (e.g., a smile bounces slightly) to    |
|     maintain engagement.                                              |
|                                                                       |
| -   The child taps one of the 4 emotion buttons.                      |
|                                                                       |
| -   On correct tap: character face lights up, plays a happy sound,    |
|     and a large green checkmark appears. The character says the       |
|     emotion name aloud (e.g., \"Happy! That\'s right!\").             |
|                                                                       |
| -   On incorrect tap: gentle, non-punishing audio cue. Character face |
|     dims slightly. A \"Try again\" prompt appears. Child gets one     |
|     additional attempt.                                               |
|                                                                       |
| -   After the second incorrect attempt: the correct answer highlights |
|     automatically in green. Child is shown the correct answer with a  |
|     supportive audio: \"This friend is feeling \[emotion\]!\"         |
|                                                                       |
| -   Session: 12 emotion cards per session, drawn randomly from a pool |
|     ensuring each of the 6 emotions appears at least twice.           |
|                                                                       |
| **[Data Logged to Database]{.underline}**                             |
|                                                                       |
| -   correct_on_first_attempt (INTEGER): Cards identified correctly    |
|     without hints.                                                    |
|                                                                       |
| -   correct_on_second_attempt (INTEGER): Cards identified correctly   |
|     after one wrong try.                                              |
|                                                                       |
| -   missed (INTEGER): Cards where the correct answer was shown        |
|     automatically.                                                    |
|                                                                       |
| -   accuracy_percentage (DECIMAL): (correct_on_first_attempt / 12) \* |
|     100.                                                              |
|                                                                       |
| -   emotion_breakdown (JSONB): Per-emotion accuracy object e.g.,      |
|     {\"happy\": 2/2, \"angry\": 1/2, \"sad\": 0/2}. Enables the       |
|     specialist to identify specific emotion-recognition gaps.         |
|                                                                       |
| **[Progression Algorithm]{.underline}**                               |
|                                                                       |
| -   Level 1: Happy, Sad, and Angry only (3 emotions, 4 buttons with   |
|     repeats as distractors).                                          |
|                                                                       |
| -   Level 2: All 6 emotions unlocked.                                 |
|                                                                       |
| -   Level 3 (Advanced): Use two nearly similar expressions (e.g., Sad |
|     vs. Scared) as distractors to increase discrimination difficulty. |
|                                                                       |
| -   Progression Trigger: accuracy_percentage \> 85% for 3 consecutive |
|     sessions unlocks the next level.                                  |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **Game 4: \"Copy Cat\"** *\[Basic + Premium\]*                        |
|                                                                       |
| **Clinical Goal:** Imitation and social learning. Imitation is the    |
| primary mechanism through which children learn social behavior,       |
| language, and motor skills. Imitation deficits are a core,            |
| early-emerging feature of ASD. This game uses a structured            |
| turn-taking format to build imitation behavior.                       |
|                                                                       |
| **ABA Target:** Imitation / Motor Sequencing / Turn-Taking / Social   |
| Learning                                                              |
|                                                                       |
| **[Mechanics]{.underline}**                                           |
|                                                                       |
| -   Screen shows an animated character (a friendly cat or robot)      |
|     performing a simple action sequence on the left half of the       |
|     screen (e.g., clap-clap-stomp, wave-wave-clap).                   |
|                                                                       |
| -   On the right half: a silhouetted version of the same character    |
|     with 3--5 large gesture buttons below (Clap, Stomp, Wave, Tap     |
|     Head, Jump).                                                      |
|                                                                       |
| -   Audio prompt: \"Your turn! Copy me!\" followed by a 2-second      |
|     replay of the model action.                                       |
|                                                                       |
| -   The child must tap the gesture buttons in the same sequence as    |
|     the model.                                                        |
|                                                                       |
| -   Correct sequence: confetti, character mirrors the child\'s        |
|     sequence and cheers.                                              |
|                                                                       |
| -   Incorrect sequence: gentle sound, gentle prompt \"Let\'s watch    |
|     again\" and the model sequence replays.                           |
|                                                                       |
| -   Maximum 2 replays per card. After 2 failed replays, show the      |
|     correct sequence highlighted and advance.                         |
|                                                                       |
| -   Session: 8 sequences per session. Sequence length starts at 2     |
|     actions.                                                          |
|                                                                       |
| **[Data Logged to Database]{.underline}**                             |
|                                                                       |
| -   sequences_correct (INTEGER): Number of sequences reproduced       |
|     correctly without replays.                                        |
|                                                                       |
| -   sequences_after_replay (INTEGER): Correct after 1 or 2 replays.   |
|                                                                       |
| -   sequences_missed (INTEGER): Required auto-demonstration.          |
|                                                                       |
| -   average_sequence_length (DECIMAL): Average number of steps in     |
|     sequences presented this session.                                 |
|                                                                       |
| -   accuracy_percentage (DECIMAL): sequences_correct / 8 \* 100.      |
|                                                                       |
| **[Progression Algorithm]{.underline}**                               |
|                                                                       |
| -   Level 1: 2-step sequences. 4 gesture buttons available.           |
|                                                                       |
| -   Level 2: 3-step sequences. All 5 gesture buttons available.       |
|                                                                       |
| -   Level 3: 4-step sequences with cross-laterality (e.g., tap head   |
|     then stomp).                                                      |
|                                                                       |
| -   Progression Trigger: accuracy_percentage \> 75% across 3 sessions |
|     unlocks the next level.                                           |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **Game 5: \"Sort the World\"** *\[Basic + Premium\]*                  |
|                                                                       |
| **Clinical Goal:** Object categorization and cognitive flexibility.   |
| Executive function deficits --- particularly difficulties with        |
| flexible categorization and set-shifting --- are well-documented in   |
| ASD. This game builds categorical thinking and reduces rigid          |
| rule-bound thinking through playful sorting tasks.                    |
|                                                                       |
| **ABA Target:** Object Categorization / Executive Function /          |
| Cognitive Flexibility                                                 |
|                                                                       |
| **[Mechanics]{.underline}**                                           |
|                                                                       |
| -   Screen shows a set of 6--8 falling or floating objects (e.g.,     |
|     apple, car, dog, banana, truck, cat).                             |
|                                                                       |
| -   Two \"bins\" at the bottom of the screen, each labeled with a     |
|     category name and icon (e.g., \"Animals\" with a paw icon,        |
|     \"Vehicles\" with a wheel icon).                                  |
|                                                                       |
| -   The child drags each object into the correct bin via touch        |
|     drag-and-drop.                                                    |
|                                                                       |
| -   On correct placement: bin lights up green, happy chime plays,     |
|     object bounces into the bin.                                      |
|                                                                       |
| -   On incorrect placement: bin shakes, gentle error sound, object    |
|     returns to its starting position for a retry.                     |
|                                                                       |
| -   After all objects are sorted: display a star rating (1--3) based  |
|     on accuracy and time taken. Celebrate with animation.             |
|                                                                       |
| -   Session: 5 sorting rounds, each with a new set of objects and     |
|     category pair.                                                    |
|                                                                       |
| -   Category pairs used: Animals/Vehicles, Food/Clothing, Toys/Tools, |
|     Things That Fly/Things That Swim, Loud Things/Quiet Things        |
|     (abstract level, advanced).                                       |
|                                                                       |
| **[Data Logged to Database]{.underline}**                             |
|                                                                       |
| -   objects_correct (INTEGER): Objects placed in the correct bin on   |
|     the first attempt.                                                |
|                                                                       |
| -   objects_incorrect (INTEGER): Incorrect placements.                |
|                                                                       |
| -   accuracy_percentage (DECIMAL).                                    |
|                                                                       |
| -   rounds_completed (INTEGER): Of the 5 rounds.                      |
|                                                                       |
| -   category_pair_log (JSONB): Which category pairs were presented    |
|     this session.                                                     |
|                                                                       |
| **[Progression Algorithm]{.underline}**                               |
|                                                                       |
| -   Level 1: 2 clear, distinct concrete categories                    |
|     (Animals/Vehicles). 6 objects. No time pressure.                  |
|                                                                       |
| -   Level 2: 3 categories introduced (a third bin appears). 9         |
|     objects.                                                          |
|                                                                       |
| -   Level 3: Abstract categories (e.g., \"Loud\" vs \"Quiet\").       |
|     Requires conceptual rather than perceptual sorting.               |
|                                                                       |
| -   Progression Trigger: accuracy_percentage \> 80% across 2 sessions |
|     advances to next level.                                           |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **Game 6: \"Name That Sound\"** *\[Basic + Premium\]*                 |
|                                                                       |
| **Clinical Goal:** Auditory discrimination and sensory processing.    |
| Many children with ASD experience auditory sensory processing         |
| differences. This game builds auditory discrimination skills and      |
| helps children associate environmental sounds with their sources,     |
| reducing sensory anxiety through familiarity.                         |
|                                                                       |
| **ABA Target:** Auditory Processing / Sensory Integration /           |
| Sound-Source Association                                              |
|                                                                       |
| **[Mechanics]{.underline}**                                           |
|                                                                       |
| -   Screen goes mostly blank. A large speaker icon pulses in the      |
|     center. The app plays a real-world environmental sound (e.g., a   |
|     dog barking, a car horn, rain falling, a phone ringing).          |
|                                                                       |
| -   Volume is set to a moderate, comfortable level --- 60% of device  |
|     volume maximum. The AI builder must never allow this game to      |
|     exceed 70% device volume.                                         |
|                                                                       |
| -   After the sound plays (2--3 seconds), 4 image cards appear on     |
|     screen: one correct source image and three distractors.           |
|                                                                       |
| -   The child taps the matching image.                                |
|                                                                       |
| -   Correct: the image animates and the sound plays again with a      |
|     voice saying \"That\'s right! That\'s a \[dog barking\]!\"        |
|                                                                       |
| -   Incorrect: gentle response, sound replays once, child gets one    |
|     more try.                                                         |
|                                                                       |
| -   Session: 10 sound cards. Sound library contains 30 unique sounds  |
|     split into three difficulty tiers.                                |
|                                                                       |
| **[Data Logged to Database]{.underline}**                             |
|                                                                       |
| -   correct_first_attempt (INTEGER).                                  |
|                                                                       |
| -   correct_second_attempt (INTEGER).                                 |
|                                                                       |
| -   missed (INTEGER).                                                 |
|                                                                       |
| -   accuracy_percentage (DECIMAL).                                    |
|                                                                       |
| -   sound_difficulty_level (INTEGER): 1, 2, or 3.                     |
|                                                                       |
| -   sound_ids_played (JSONB array): IDs of sounds presented this      |
|     session.                                                          |
|                                                                       |
| **[Progression Algorithm]{.underline}**                               |
|                                                                       |
| -   Level 1: Highly familiar sounds (dog, baby crying, phone          |
|     ringing). High contrast between distractors.                      |
|                                                                       |
| -   Level 2: Less familiar sounds (kettle boiling, keyboard typing,   |
|     scissors). Closer distractors.                                    |
|                                                                       |
| -   Level 3: Layered sounds (two sounds mixed together, child must    |
|     identify the dominant one).                                       |
|                                                                       |
| -   Progression Trigger: accuracy_percentage \> 80% across 3 sessions |
|     unlocks the next level.                                           |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **Game 7: \"Calm Corner\"** *\[Basic + Premium\]*                     |
|                                                                       |
| **Clinical Goal:** Sensory self-regulation and emotional              |
| co-regulation. Emotional dysregulation is one of the most disruptive  |
| features of ASD in daily life. This game teaches the child a simple,  |
| evidence-based breathing and sensory regulation strategy through      |
| visual biofeedback.                                                   |
|                                                                       |
| **ABA Target:** Emotional Self-Regulation / Deep Breathing / Sensory  |
| Calming                                                               |
|                                                                       |
| **[Mechanics]{.underline}**                                           |
|                                                                       |
| -   Screen renders a slowly expanding and contracting visual element  |
|     --- default is a soft glowing circle that grows on inhale and     |
|     shrinks on exhale. Alternatively: an animated sea creature        |
|     floating upward (inhale) and downward (exhale).                   |
|                                                                       |
| -   Audio guide narrates: \"Let\'s breathe together. Breathe IN as it |
|     grows\... breathe OUT as it shrinks.\" Voice is calm, slow, and   |
|     gender-neutral.                                                   |
|                                                                       |
| -   The inhale phase takes 4 seconds. The exhale phase takes 6        |
|     seconds. This is the physiologically calming 4-6 ratio.           |
|                                                                       |
| -   After 5 complete breath cycles (50 seconds), a calm animation     |
|     plays (stars appearing, a sun rising) and a gentle voice says     |
|     \"Great breathing! You did it.\"                                  |
|                                                                       |
| -   Premium AI Camera: The MediaPipe affect model monitors the        |
|     child\'s facial tension and provides a simple annotation in the   |
|     ai_vision_metrics field (e.g., {\"affect_start\": \"tense\",      |
|     \"affect_end\": \"calm\"}).                                       |
|                                                                       |
| -   This game has NO failure state. There is no incorrect action.     |
|     Every session results in a completion reward.                     |
|                                                                       |
| -   The game is deliberately designed to be initiated by a parent or  |
|     caregiver before an anticipated stressful event or during a       |
|     meltdown de-escalation.                                           |
|                                                                       |
| **[Data Logged to Database]{.underline}**                             |
|                                                                       |
| -   cycles_completed (INTEGER): Number of complete breath cycles (max |
|     5 per session).                                                   |
|                                                                       |
| -   session_duration_seconds (INTEGER).                               |
|                                                                       |
| -   affect_transition (JSONB, Premium): {\"affect_start\":            |
|     \"string\", \"affect_end\": \"string\"} from AI camera.           |
|                                                                       |
| -   initiated_by (ENUM: PARENT, CAREGIVER, CHILD): Who started the    |
|     session.                                                          |
|                                                                       |
| **[Progression Algorithm]{.underline}**                               |
|                                                                       |
| -   This game does not have difficulty levels. It is a fixed, calming |
|     protocol.                                                         |
|                                                                       |
| -   The background visual theme can be unlocked as the child          |
|     completes sessions: starts with a basic circle, unlocks ocean     |
|     scene after 5 sessions, unlocks space scene after 15 sessions.    |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **Game 8: \"Story Builder\"** *\[Premium Only\]*                      |
|                                                                       |
| **Clinical Goal:** Social narrative comprehension and theory of mind. |
| Theory of mind --- the ability to understand that other people have   |
| different thoughts, beliefs, and intentions --- is the foundational   |
| social-cognitive deficit in ASD. This game builds social narrative    |
| understanding through structured, sequenced social story              |
| reconstruction.                                                       |
|                                                                       |
| **ABA Target:** Theory of Mind / Social Narrative Comprehension /     |
| Sequential Reasoning                                                  |
|                                                                       |
| **[Mechanics]{.underline}**                                           |
|                                                                       |
| -   Screen presents 3--5 scrambled illustrated panels depicting a     |
|     simple social scenario (e.g., a child drops their toy, a friend   |
|     sees it, friend picks it up and returns it). Panels are displayed |
|     as draggable cards.                                               |
|                                                                       |
| -   Audio prompt: \"Can you put the story in the right order? Drag    |
|     the pictures to tell the story!\"                                 |
|                                                                       |
| -   The child drags and drops the panels into a row of numbered slots |
|     (1, 2, 3 etc.).                                                   |
|                                                                       |
| -   On placing the last panel: the system evaluates the sequence.     |
|                                                                       |
| -   Correct order: panels animate into a mini flip-book animation     |
|     that plays the story through. A celebratory voice says \"Great    |
|     story! You got it!\"                                              |
|                                                                       |
| -   Incorrect order: the first out-of-place panel gently shakes and   |
|     is returned to the pool. The child tries again for the incorrect  |
|     position only.                                                    |
|                                                                       |
| -   After correct completion (or 3 failed full attempts): the story   |
|     plays automatically in correct order as a reward and learning     |
|     demonstration.                                                    |
|                                                                       |
| -   Session: 3 stories per session drawn from a library of 20 social  |
|     scenario story packs.                                             |
|                                                                       |
| -   Story packs are categorized: Sharing & Kindness, Greetings &      |
|     Farewells, Asking for Help, Disappointment & Acceptance.          |
|                                                                       |
| **[Data Logged to Database]{.underline}**                             |
|                                                                       |
| -   stories_correct_first_try (INTEGER).                              |
|                                                                       |
| -   stories_correct_after_hints (INTEGER).                            |
|                                                                       |
| -   stories_auto_completed (INTEGER).                                 |
|                                                                       |
| -   accuracy_percentage (DECIMAL).                                    |
|                                                                       |
| -   panel_error_log (JSONB): Records which specific panel position    |
|     errors occurred for clinical analysis.                            |
|                                                                       |
| -   story_ids_played (JSONB array).                                   |
|                                                                       |
| **[Progression Algorithm]{.underline}**                               |
|                                                                       |
| -   Level 1: 3-panel stories. Simple, concrete cause-and-effect       |
|     narratives.                                                       |
|                                                                       |
| -   Level 2: 4-panel stories. Introduce emotion-based narratives      |
|     (e.g., \"How does the child feel when their friend shares?\").    |
|                                                                       |
| -   Level 3: 5-panel stories. Include stories requiring inferring     |
|     mental states (e.g., \"Why did the friend help?\").               |
|                                                                       |
| -   Progression Trigger: accuracy_percentage \> 70% across 3 sessions |
|     unlocks the next level.                                           |
+-----------------------------------------------------------------------+

**6.3 Game Assignment --- Therapy Matching by Primary Concern**

When the parent selects primary concerns during onboarding (Section
3.2.1), the Daily Mission generator must weight game assignments
according to the following clinical mapping table.

  --------------------- -------------------------------------------------
  **Parent-Selected     **Priority Games (listed in order of clinical
  Primary Concern**     priority)**

  Social Development    The Waiting Game, Emotion Mirror, Copy Cat, Story
                        Builder

  Communication         Emotion Mirror, Story Builder, Copy Cat, Name
                        That Sound

  Behavior & Routine    Calm Corner, Sort the World, Bubble Pop, Copy Cat

  Sensory Sensitivities Calm Corner, Name That Sound, Bubble Pop, Sort
                        the World

  Motor Skills          Bubble Pop, Copy Cat, Sort the World, Name That
                        Sound

  No Specific Concern / Rotate all 8 games equally across the week
  All-Around            
  --------------------- -------------------------------------------------

> **🔹 DIRECTIVE: The Daily Mission generator must assign 3 games per
> day. Games not in the priority list for the selected concern are still
> available in the Games Library tab but are not included in the
> auto-generated daily plan unless the parent manually adds them.**

**7. Caregiver / Nanny Delegation System**

Parents may invite a caregiver (nanny, relative, or aide) to administer
daily therapy games on their behalf. This section defines the exact
scope of caregiver access. Access outside of this scope is strictly
forbidden.

**7.1 Caregiver Invitation Flow**

1.  Parent navigates to Settings \> Manage Caregivers \> Add Caregiver.

2.  Parent enters the caregiver\'s email address or phone number.

3.  The system sends an invitation link via email/SMS. The link expires
    in 48 hours.

4.  Caregiver clicks the link, downloads the app (if not installed), and
    creates an account. The role field is automatically set to
    CAREGIVER.

5.  A caregiver_assignments table entry is created linking the caregiver
    user ID to the child ID.

**7.2 Caregiver Access Permissions**

  --------------------- -------------------------------------------------
  **Feature**           **Caregiver Access**

  Today\'s Mission      FULL ACCESS --- can initiate, play, and complete
  (assigned games)      games

  Child\'s clinical     NO ACCESS --- hidden at the database RLS level
  diagnosis             

  M-CHAT-R/F screening  NO ACCESS
  results               

  Past medical history  NO ACCESS

  Telehealth            NO ACCESS --- tab not rendered for caregiver role
  appointment portal    

  Payment portal /      NO ACCESS --- tab not rendered
  Store checkout        

  Child profile editing NO ACCESS --- read-only name and photo displayed
                        only

  Progress reports &    NO ACCESS --- data writes only, no reads
  charts                
  --------------------- -------------------------------------------------

> *⚠ NOTE: All game data generated during a caregiver session is written
> to the activities_log table with the correct child_id. The parent\'s
> dashboard and the specialist\'s clinical view reflect this data as
> part of the child\'s continuous record. The caregiver\'s user ID is
> stored in a logged_by field for audit purposes.*

**8. Database Schema & Architecture**

The AI builder must provision a PostgreSQL database using the exact
schema definitions below. No additional tables may be created. No fields
may be omitted. All ENUMs must be created as PostgreSQL native ENUM
types.

**8.1 Table Definitions**

**users**

  ------------------ ----------------------------------------------------------
  **Column**         **Definition**

  id                 UUID, Primary Key, DEFAULT gen_random_uuid()

  email              VARCHAR(255), UNIQUE, NOT NULL

  password_hash      VARCHAR(255), NOT NULL

  role               ENUM(\'PARENT\',\'SPECIALIST\',\'CAREGIVER\',\'ADMIN\'),
                     NOT NULL

  tier_level         ENUM(\'FREE\',\'BASIC\',\'PREMIUM\'), DEFAULT \'FREE\'

  is_verified        BOOLEAN, DEFAULT FALSE --- admin approval flag for
                     specialists

  created_at         TIMESTAMP WITH TIME ZONE, DEFAULT NOW()

  last_active_at     TIMESTAMP WITH TIME ZONE
  ------------------ ----------------------------------------------------------

**children**

  ------------------- ----------------------------------------------------
  **Column**          **Definition**

  id                  UUID, Primary Key

  parent_id           UUID, FOREIGN KEY -\> users.id, ON DELETE CASCADE

  name                VARCHAR(100), NOT NULL

  dob                 DATE, NOT NULL --- used for all age-gating logic

  gender              ENUM(\'BOY\',\'GIRL\',\'UNSPECIFIED\')

  primary_concerns    TEXT\[\] --- array of concern strings from
                      onboarding

  medical_history     JSONB --- stores any clinical notes added by
                      specialists

  profile_photo_url   TEXT, NULLABLE
  ------------------- ----------------------------------------------------

**assessments**

  ------------------ ----------------------------------------------------
  **Column**         **Definition**

  id                 UUID, Primary Key

  child_id           UUID, FOREIGN KEY -\> children.id

  test_type          ENUM(\'MCHAT\') --- extensible for future
                     instruments

  raw_answers        JSONB --- array of 20 booleans in question order

  risk_score         INTEGER --- computed sum of ASD risk indicators

  risk_level         ENUM(\'LOW\',\'MODERATE\',\'HIGH\')

  administered_at    TIMESTAMP WITH TIME ZONE, DEFAULT NOW()
  ------------------ ----------------------------------------------------

**activities_log**

  ----------------------- ----------------------------------------------------
  **Column**              **Definition**

  id                      UUID, Primary Key

  child_id                UUID, FOREIGN KEY -\> children.id

  logged_by               UUID, FOREIGN KEY -\> users.id --- parent or
                          caregiver who ran the session

  game_id                 VARCHAR(50) --- e.g., \'bubble_pop\',
                          \'waiting_game\', \'emotion_mirror\'

  duration_seconds        INTEGER

  accuracy_percentage     DECIMAL(5,2)

  level_reached           INTEGER

  game_specific_metrics   JSONB --- all per-game data fields described in
                          Section 6

  ai_vision_metrics       JSONB, NULLABLE --- MediaPipe gaze/affect data
                          (Premium only)

  sync_status             BOOLEAN, DEFAULT FALSE --- false = offline, true =
                          synced to server

  created_at              TIMESTAMP WITH TIME ZONE, DEFAULT NOW()
  ----------------------- ----------------------------------------------------

**appointments**

  ---------------------- -------------------------------------------------------------
  **Column**             **Definition**

  id                     UUID, Primary Key

  parent_id              UUID, FOREIGN KEY -\> users.id

  specialist_id          UUID, FOREIGN KEY -\> users.id

  child_id               UUID, FOREIGN KEY -\> children.id

  scheduled_at           TIMESTAMP WITH TIME ZONE, NOT NULL

  status                 ENUM(\'PENDING\',\'CONFIRMED\',\'COMPLETED\',\'CANCELLED\')

  amount_paid_bdt        DECIMAL(10,2), NULLABLE

  discount_applied_pct   DECIMAL(5,2), DEFAULT 0

  payment_gateway        ENUM(\'STRIPE\',\'SSLCOMMERZ\'), NULLABLE

  payment_reference      VARCHAR(255), NULLABLE

  created_at             TIMESTAMP WITH TIME ZONE, DEFAULT NOW()
  ---------------------- -------------------------------------------------------------

**clinical_soap_notes**

  ------------------------ ----------------------------------------------------
  **Column**               **Definition**

  id                       UUID, Primary Key

  appointment_id           UUID, FOREIGN KEY -\> appointments.id, UNIQUE

  ai_generated_json        JSONB --- keys: subjective, objective, assessment,
                           plan

  specialist_edited_json   JSONB --- the version after specialist edits, before
                           signing

  is_signed                BOOLEAN, DEFAULT FALSE

  signed_at                TIMESTAMP WITH TIME ZONE, NULLABLE

  signed_by                UUID, FOREIGN KEY -\> users.id, NULLABLE

  created_at               TIMESTAMP WITH TIME ZONE, DEFAULT NOW()
  ------------------------ ----------------------------------------------------

**caregiver_assignments**

  ----------------------- ----------------------------------------------------
  **Column**              **Definition**

  id                      UUID, Primary Key

  caregiver_id            UUID, FOREIGN KEY -\> users.id

  child_id                UUID, FOREIGN KEY -\> children.id

  assigned_by_parent_id   UUID, FOREIGN KEY -\> users.id

  is_active               BOOLEAN, DEFAULT TRUE

  created_at              TIMESTAMP WITH TIME ZONE, DEFAULT NOW()
  ----------------------- ----------------------------------------------------

**8.2 Row-Level Security Policies**

> **🔹 DIRECTIVE: RLS must be enabled on ALL tables. The following
> policies are the minimum required.**

  --------------------- -------------------------------------------------
  **Table**             **RLS Policy**

  children              Parents can SELECT/INSERT/UPDATE/DELETE only rows
                        where parent_id = auth.uid(). Specialists can
                        SELECT rows for children who have a confirmed
                        appointment with them. Caregivers can SELECT only
                        rows for children in their caregiver_assignments.

  activities_log        Parents can SELECT all rows for their children.
                        Caregivers can INSERT rows for their assigned
                        children only. Caregivers cannot SELECT any rows.
                        Specialists can SELECT rows for their assigned
                        patients.

  assessments           Parents can SELECT rows for their children.
                        Caregivers have NO access. Specialists can SELECT
                        rows for their assigned patients.

  clinical_soap_notes   Specialists can SELECT/INSERT/UPDATE only their
                        own notes. Parents can SELECT finalized
                        (is_signed = true) notes for their children only.

  appointments          Parents see only their own appointments.
                        Specialists see only their own appointments.
                        Caregivers have no access.
  --------------------- -------------------------------------------------

**9. E-Commerce Storefront**

The integrated storefront allows parents to purchase specialized sensory
and therapy equipment for home use. All purchases use an external
payment gateway (Stripe or SSLCommerz) --- never Apple/Google IAP.

**9.1 UI/UX Specification**

  --------------------- -------------------------------------------------
  **Screen**            **Specification**

  Store Home            Horizontal category filter chips at top. Product
                        grid below (2 columns). Each product card shows:
                        product image, name, price in BDT, and an \"Add
                        to Cart\" button.

  Product Detail Page   Full-width image carousel. Product name,
                        description, price, stock status. \"Add to Cart\"
                        and \"Buy Now\" buttons. Related products row at
                        the bottom.

  Shopping Cart         Line items with quantity controls (+/-). Running
                        total. Shipping address input. \"Proceed to
                        Payment\" button routing to Stripe/SSLCommerz
                        checkout.

  Order Confirmation    Order ID, items purchased, estimated delivery.
                        Option to share receipt via WhatsApp or email.
  --------------------- -------------------------------------------------

**9.2 Product Taxonomy**

> **🔹 DIRECTIVE: All products in the database must be classified using
> the following exact taxonomy hierarchy. This ensures future
> compatibility with Google Shopping Ads.**

  --------------------- -------------------------------------------------
  **Category Path**     **Product Types**

  Health & Beauty \>    Physical screening kit bundles
  Health Care \>        
  Medical Tests         

  Toys & Games \>       Sensory toys, fine motor kits, fidget tools,
  Educational Toys      building blocks, cause-and-effect toys

  Health & Beauty \>    Light therapy panels, UV lamps for sensory rooms
  Health Care \>        
  Therapy Lamps         

  Baby & Toddler \>     Sensory chews, chewy tubes, textured teethers
  Feeding \> Oral       
  Sensory               

  Home & Garden \>      Weighted blankets, compression vests, sensory
  Kids\' Room \>        swings
  Sensory Equipment     
  --------------------- -------------------------------------------------

**10. Final Execution Directives**

This document constitutes the complete and authoritative specification
for the NeuroChain 3.0 build. The AI builder must adhere to every
directive in this document exactly as written.

+-----------------------------------------------------------------------+
| **Non-Negotiable Build Rules**                                        |
+-----------------------------------------------------------------------+
| **Offline-First:** The app must function completely offline. No       |
| feature may require an active internet connection to work, with the   |
| sole exception of: (a) the AI camera WebSocket stream, (b) telehealth |
| video calls, (c) payment processing.                                  |
|                                                                       |
| **Strict Scope:** This version covers autism only. Dyslexia screener, |
| AAC board, and any other diagnostic instruments are explicitly OUT OF |
| SCOPE. Do not implement them.                                         |
|                                                                       |
| **Payment Routing:** Subscriptions go through Apple/Google. Physical  |
| goods and telehealth go through Stripe/SSLCommerz. No exceptions.     |
| This is an App Store policy requirement.                              |
|                                                                       |
| **Data Preservation:** User data is never deleted on downgrade. Blur  |
| and lock the UI. Preserve the data.                                   |
|                                                                       |
| **AI is an Assistant:** The AI SOAP note scribe is a draft tool. The  |
| specialist\'s \"Sign & Finalize\" button is the legally binding       |
| action. The AI must never be presented as the author of a clinical    |
| record.                                                               |
|                                                                       |
| **Game Mechanics are Clinical Protocols:** The scoring logic,         |
| progression thresholds, session parameters, and data-logging fields   |
| in Section 6 are clinical specifications, not suggestions. Do not     |
| alter them.                                                           |
|                                                                       |
| **Role Separation is Absolute:** A parent never sees a specialist     |
| view. A caregiver never sees clinical data. Enforce at the RLS layer, |
| not just the UI layer.                                                |
+-----------------------------------------------------------------------+

*--- End of Document ---*

NeuroChain 3.0 \| Version 3.0 \| Confidential
