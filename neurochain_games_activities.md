**NEUROCHAIN**

**Games & Activities**

Design Specification & Developer Brief

Multidisciplinary Neurodevelopmental Intervention Framework

ABA · Speech & Language · Occupational Therapy

Version 1.0 \| Dhaka, Bangladesh

**Overview & Design Philosophy**

Neurochain\'s Games & Activities module operationalizes the
multidisciplinary ABA-SLT-OT clinical framework into an engaging,
trackable parent-led home therapy system. The design is structured
around two interlocking layers: **On-Screen Games** that provide
therapeutic engagement directly within the app, and **Off-Screen
Activities** that translate clinical modalities into home-based
interventions guided by in-app video demonstrations.

**Core Design Principle:** Every interaction --- whether digital or
physical --- must map to at least one measurable ABLLS-R skill category,
a target sensory system, or a speech-motor objective. The app functions
as the clinical data layer; the home becomes the therapy floor.

+-----------------------------------+-----------------------------------+
| **On-Screen Layer**               | **Off-Screen Layer**              |
+-----------------------------------+-----------------------------------+
| 5 Therapeutic Games               | Activities Across 5 Problem       |
|                                   | Profiles                          |
| -   Gamified ABA & SLT objectives |                                   |
|                                   | -   Video demonstration library   |
| -   Real-time adaptive difficulty |                                   |
|                                   | -   Step-by-step parent guidance  |
| -   In-app progress analytics     |                                   |
|                                   | -   ABA prompt-level tracking     |
| -   Parent dashboard integration  |                                   |
|                                   | -   Session log & milestone       |
|                                   |     alerts                        |
+-----------------------------------+-----------------------------------+

**Problem Profiles Covered:** Social Communication · Sensory Processing
· Speech & Oral-Motor · Motor Skills · Emotional Regulation & Behavior

**On-Screen Games**

**Developer Brief:** The following five games form the core on-screen
therapeutic module. Each game is fully specified with screen flows,
content architecture, adaptive algorithms, technical stack requirements,
and parent dashboard metrics. All games must support Bengali and English
bilingual interfaces and offline-first architecture.

+-----------------------------------------------------------------------+
| **GAME 1** · SOCIAL · EMOTIONAL RECOGNITION                           |
|                                                                       |
| **Emotion Match Arena**                                               |
+-----------------------------------------------------------------------+

**Purpose:** Build Theory of Mind by training the child to recognize,
name, and respond to facial expressions and emotional contexts ---
directly targeting ABLLS-R Categories L (Social Interaction), G
(Tacting), and H (Intraverbals).

**Game Overview**

  ------------------- ---------------------------------------------------
  **Target Profiles** Social Communication, Emotional Regulation

  **ABLLS-R           L (Social Interaction), G (Tacting), H
  Categories**        (Intraverbals), F (Manding)

  **Age Range**       3 -- 10 years (adaptive difficulty)

  **Session Length**  5 -- 10 minutes per session

  **Core Mechanic**   Match an emotion displayed on a card/avatar to the
                      correct label or scenario
  ------------------- ---------------------------------------------------

**Screen Architecture & User Flow**

**Screen 1 --- Home/Lobby:** Character avatar greeter. Parent sets
difficulty tier (Beginner / Intermediate / Advanced). Difficulty
selection adjusts the number of emotion options, abstraction level of
cues (photo face → cartoon → text-only scenario), and the requirement
for a verbal response.

**Screen 2 --- Stimulus Display:** Full-screen animated face or social
scenario illustration is displayed. A calm 3-second observation window
plays before response options appear. This replicates clinical \'wait
time\' training.

**Screen 3 --- Response Interface:** Child selects the matching emotion
from a 2-card (Beginner), 4-card (Intermediate), or 6-card (Advanced)
array. Cards use both emoji-style icons and word labels. Option to
enable voice input so the child can speak the answer aloud.

**Screen 4 --- Feedback & Reinforcement:** Correct: celebratory
animation + sound. Incorrect: a \'try again\' prompt with a gentle
audio/visual hint (the avatar animates the emotion more expressively).
After 2 incorrect attempts, the correct answer is highlighted and
explained.

**Screen 5 --- Parent Report Summary:** End-of-session screen showing:
accuracy %, emotion-by-emotion breakdown, session duration, and a
\'Practice Suggestion\' prompt linking to a matched off-screen activity.

**Difficulty Tiers & Content Library**

  -------------- ------------------ ------------- ------------ ---------------------
  **Tier**       **Stimuli Type**   **Options**   **Response   **ABLLS-R Focus**
                                                  Mode**       

  Beginner       Photographic human 2 cards       Tap          Tacting (G)
                 faces (6 core                                 
                 emotions)                                     

  Intermediate   Illustrated social 4 cards       Tap +        Intraverbals (H)
                 scenarios                        optional     
                                                  voice        

  Advanced       Text-based         6 cards       Voice        Social Interaction
                 situation                        required     (L)
                 descriptions                                  
  -------------- ------------------ ------------- ------------ ---------------------

**Technical Specifications**

-   Framework: React Native (iOS + Android). Animated faces via Lottie
    JSON animations.

-   Content: Minimum 120 unique stimulus cards across 12 emotion
    categories (happy, sad, angry, scared, surprised, disgusted, proud,
    embarrassed, frustrated, calm, excited, confused).

-   Accessibility: All emotion labels must have Bengali + English
    dual-language toggle. Text size adjustable.

-   Voice Input: Integrate on-device speech recognition (Whisper API or
    Google Speech-to-Text). Accepted responses are fuzzy-matched against
    a synonym dictionary per emotion.

-   Data Layer: Log each trial as: { stimulusID, correctAnswer,
    childResponse, responseTimeMs, promptsUsed, timestamp }.

-   Adaptive Algorithm: If child achieves \>80% on current tier for 3
    consecutive sessions, auto-suggest tier upgrade. If \<50%, suggest
    tier downgrade.

**Parent Dashboard Metrics**

-   Emotion-specific accuracy trend (line chart per emotion over 30
    days)

-   Average response latency per session (measures processing speed
    improvement)

-   Tier progression history

-   Session frequency heatmap (calendar view)

+-----------------------------------------------------------------------+
| **GAME 2** · COMMUNICATION · REQUESTING (MANDING)                     |
|                                                                       |
| **Mand & Seek**                                                       |
+-----------------------------------------------------------------------+

**Purpose:** Train functional requesting (Manding --- ABLLS-R Category
F) by making communication the key to unlocking in-game rewards, then
bridging to physical object retrieval. Reduces frustration-based
behaviors by empowering the child with functional language.

**Game Overview**

  ------------------- ---------------------------------------------------
  **Target Profiles** Social Communication, Speech & Language

  **ABLLS-R           F (Mands/Requests), C (Receptive Language), G
  Categories**        (Tacting), I (Spontaneous Vocalizations)

  **Age Range**       2 -- 8 years

  **Session Length**  8 -- 12 minutes

  **Core Mechanic**   Child must request a displayed item (verbally or
                      via AAC tap) to earn it, then physically retrieve
                      it in the home environment
  ------------------- ---------------------------------------------------

**Screen Architecture & User Flow**

**Screen 1 --- Setup (Parent):** Parent photographs 8--16 household
objects (toys, snacks, activities) using the in-app camera. These become
the child\'s personalized \'Mand Menu.\' Items are tagged by category
(food, toy, activity). This takes 2 minutes and is done once per week.

**Screen 2 --- Want Display:** The app presents one item from the menu
behind a blurred or partially revealed \'mystery reveal\' animation. The
child must identify and request the item before it is fully revealed.
This creates anticipation and motivates communication.

**Screen 3 --- Request Interface:** Child communicates their request
via: (a) Voice --- child speaks the item name; (b) AAC Board --- taps
the item\'s symbol; or (c) Full sentence --- child taps word chips to
build \'I want \[item\] please.\' Parent selects mode during setup.

**Screen 4 --- Seek Mission:** Upon successful request, the app displays
a \'GO FIND IT!\' screen with the item photo, a countdown timer, and
directional hints (hot/cold proximity game as optional extension). Child
retrieves the real object --- the off-screen bridge.

**Screen 5 --- Reward & Log:** Child returns, taps \'I found it!\' and
holds item to the camera for visual confirmation (optional CV check).
Reward animation plays. Session log records: item requested, request
mode used, prompt level required, seek duration.

**Communication Mode Architecture**

  ----------- ---------------- ------------------ ------------------------
  **Mode**    **Input Method** **Target Skill**   **Prompt Support**

  Verbal      Microphone ---   Spontaneous        Audio replay model →
              spoken word      vocalization (I)   child imitates

  AAC Tap     Symbol grid ---  Receptive +        Visual highlight of
              2×2 to 5×5       expressive (C, F)  correct symbol

  Sentence    Drag word chips  Syntax & grammar   Pre-filled chips with
  Builder     to sentence bar  (J)                gaps
  ----------- ---------------- ------------------ ------------------------

**Technical Specifications**

-   Custom photo library: On-device storage of parent-uploaded item
    photos. Offline-first architecture required --- many users in Dhaka
    have intermittent connectivity.

-   AAC symbol library: Integrate open-source ARASAAC symbol set (free,
    multilingual). Bengali labels mandatory.

-   Voice recognition: Accept single-word, partial phrase, and
    full-sentence responses. Confidence threshold configurable by
    parent.

-   Proximity game (optional): Uses BLE beacon or simple room-map that
    parent draws in-app to add hot/cold directional hints.

-   Offline sync: Queue session logs locally, sync to cloud when
    connectivity resumes.

+-----------------------------------------------------------------------+
| **GAME 3** · COGNITIVE · SOCIAL STORIES · BEHAVIORAL                  |
|                                                                       |
| **Story Navigator**                                                   |
+-----------------------------------------------------------------------+

**Purpose:** Deliver and track Social Stories in an interactive,
engaging digital format. Targets Theory of Mind deficits by walking
children through social scenarios with branching outcomes, building
predictability awareness and behavioral self-regulation.

**Game Overview**

  ------------------- ---------------------------------------------------
  **Target Profiles** Social Communication, Emotional Regulation &
                      Behavior

  **ABLLS-R           L (Social Interaction), H (Intraverbals), N
  Categories**        (Classroom Routines), P (Generalized Responding)

  **Age Range**       4 -- 12 years (reading level adaptive)

  **Session Length**  5 -- 15 minutes

  **Core Mechanic**   Branching narrative where child makes choices for
                      the protagonist and witnesses the social
                      consequences --- positive and negative --- of each
                      choice
  ------------------- ---------------------------------------------------

**Screen Architecture & User Flow**

**Screen 1 --- Story Library:** Grid of story cards organized by
scenario category: School Routines, Sharing & Turn-Taking, Handling
Frustration, Greetings, Lunch & Transitions, Visiting New Places. Each
card shows difficulty level (3 stars) and a \'last played\' badge.

**Screen 2 --- Personalization (Parent):** Before first play, parent
inputs child\'s name, preferred pronoun, and selects a character avatar.
The app substitutes the child\'s name throughout the narrative, creating
a first-person story --- exactly matching clinical Social Story
compositional rules.

**Screen 3 --- Narrative Player:** Illustrated scenes with animated
characters. Each scene displays: (a) a Descriptive sentence narrated
aloud; (b) a Perspective bubble showing the character\'s feelings; (c)
optional Directive prompt asking the child what the character should do.

**Screen 4 --- Choice Point:** At key moments, child taps one of 2--3
illustrated choice buttons. Each choice triggers a branching outcome
scene. Positive choices lead to happy resolution animations. Negative
choices show consequence (no punishment; just natural consequence) and
then redirect back to a try-again branch.

**Screen 5 --- Role-Play Launcher:** After story completion, the app
prompts a \'Now let\'s practice!\' screen. It displays a simple
role-play script with props list for the corresponding off-screen
activity and a video guide link.

**Story Composition Engine**

**Sentence Ratio Enforcement:** The content management system enforces
the clinical 3--5:1 ratio of Descriptive/Perspective to Directive
sentences. Each story scene is tagged with its sentence type. The CMS
will reject story uploads that violate this ratio.

**Story Builder (Parent Tool):** Parent-facing story builder with guided
templates. Parent fills in: (1) the trigger situation; (2) the child\'s
typical response; (3) the desired response. The app auto-generates a
draft story structure, which the parent reviews and approves. Uses the
Anthropic Claude API to generate natural, child-appropriate story text
from parent inputs.

**Technical Specifications**

-   Story library minimum: 30 pre-built stories at launch, covering the
    6 scenario categories above. 5 stories per category.

-   Localization: All stories available in Bengali and English. Audio
    narration recorded by a native Bengali speaker.

-   AI Story Generator: Parent inputs scenario → Claude API generates
    compliant story draft → parent reviews → saved to child\'s personal
    library.

-   Analytics: Track which choice branches child takes. Repeated
    negative-choice selection on a specific scenario flags a \'Practice
    Target\' in the parent dashboard.

-   Widgit symbols: Integrate Widgit Online API or equivalent for AAC
    symbol overlays on story text.

+-----------------------------------------------------------------------+
| **GAME 4** · MOTOR SKILLS · SENSORY · PROPRIOCEPTION                  |
|                                                                       |
| **Rhythm Burst**                                                      |
+-----------------------------------------------------------------------+

**Purpose:** Provide structured vestibular and proprioceptive input
through rhythmic physical movement prompted by on-screen cues. Targets
gross motor planning, bilateral coordination, impulse control, and
sensory regulation --- directly replicating the effects of clinical
platform swings and heavy-work activities.

**Game Overview**

  ------------------- ---------------------------------------------------
  **Target Profiles** Sensory Processing, Motor Skills, Emotional
                      Regulation

  **ABLLS-R           Y (Gross Motor), D (Motor Imitation), A
  Categories**        (Cooperation)

  **Sensory Systems** Vestibular, Proprioceptive, Tactile

  **Age Range**       3 -- 10 years

  **Session Length**  5 -- 8 minutes (used as a sensory warm-up or
                      regulation break)

  **Core Mechanic**   Animated avatar performs a physical action; child
                      mirrors the movement in real space; camera
                      (optional) or parent tap confirms completion
  ------------------- ---------------------------------------------------

**Screen Architecture & User Flow**

**Screen 1 --- Regulation Check-In (Parent):** Parent selects the
child\'s current regulation state: \'Too Activated / Hyperactive\'
(needs calming input → slow, deep pressure moves), \'Too Low /
Lethargic\' (needs alerting input → fast, jumping moves), or
\'Regulated\' (maintenance routine). This determines which movement
sequence the app serves.

**Screen 2 --- Movement Stage:** Full-screen animated animal avatar
(child selects their avatar: bear, frog, crab, elephant). Avatar
performs a movement with on-screen text label and a rhythmic beat.
Movement sequences include: Bear Crawl, Frog Jump, Crab Walk, Elephant
Stomp, Wall Push (proprioceptive), Spin & Freeze (vestibular), Log Roll,
Star Jump.

**Screen 3 --- Completion Confirm:** After each movement, a large
\'DONE!\' button appears. Parent taps to confirm child completed the
move. Optional: device camera uses basic pose detection (MediaPipe) to
auto-confirm. The game proceeds to the next movement in sequence.

**Screen 4 --- Sensory Score:** End of session: \'Energy Meter\' visual
shows how many alerting vs calming moves were completed. Parent rates
child\'s regulation state post-session (1--5 calm scale). This data
feeds the adaptive algorithm.

**Movement Library & Sensory Mapping**

  ---------------- ---------------------- ---------------- --------------
  **Movement**     **Sensory Effect**     **Input Type**   **Duration**

  Bear Crawl       Proprioceptive (heavy  Gross motor      30 sec
                   work)                                   

  Frog Jump        Vestibular             Bilateral        10 reps
                   (alerting) +           coordination     
                   Proprioceptive                          

  Crab Walk        Bilateral              Gross motor      30 sec
                   coordination + upper                    
                   body proprioception                     

  Wall Push        Proprioceptive (deep   Isometric hold   10 sec × 3
                   pressure, calming)                      

  Log Roll         Vestibular (linear,    Full body        2 × 5 rolls
                   calming)                                

  Spin & Freeze    Vestibular             Impulse control  3 × 5 sec spin
                   (rotational, alerting)                  

  Elephant Stomp   Proprioceptive         Rhythmic gross   20 stomps
                   (grounding)            motor            

  Star Jump        Vestibular             Bilateral        15 reps
                   (alerting) + Cardio    coordination     
  ---------------- ---------------------- ---------------- --------------

**Technical Specifications**

-   Animations: High-quality Lottie animations for each animal avatar ×
    movement combination (8 animals × 8 movements = 64 animations
    minimum).

-   Pose detection: MediaPipe Pose (on-device, privacy-safe) for
    optional auto-confirmation. Fallback to parent tap always available.

-   Adaptive algorithm: If parent rates post-session regulation \>4 for
    3 sessions, the algorithm increases movement intensity. If \<2, it
    shifts sequence toward calming-dominant.

-   Sensory diet scheduler: Parent can schedule 3 Rhythm Burst breaks
    per day (morning, midday, evening) with push notification reminders.

+-----------------------------------------------------------------------+
| **GAME 5** · LANGUAGE · TACTING · RECEPTIVE LANGUAGE                  |
|                                                                       |
| **Label Lab**                                                         |
+-----------------------------------------------------------------------+

**Purpose:** Build expressive vocabulary (Tacting, ABLLS-R Category G)
and receptive language (Category C) through a high-engagement flashcard
labeling game using household objects and natural environment photos,
directly implementing Natural Environment Teaching principles in a
digital format.

**Game Overview**

  ------------------- ---------------------------------------------------
  **Target Profiles** Social Communication, Speech & Language

  **ABLLS-R           G (Tacting), C (Receptive Language), F (Mands), J
  Categories**        (Syntax & Grammar)

  **Age Range**       2 -- 8 years

  **Session Length**  5 -- 10 minutes

  **Core Mechanic**   Show → Label → Build: child identifies objects,
                      then builds multi-word descriptions, then follows
                      receptive instructions --- a 3-stage progressive
                      challenge
  ------------------- ---------------------------------------------------

**Screen Architecture & Three-Stage Flow**

**STAGE 1 --- SHOW & LABEL (Tacting):** A photo of an object appears
(from the parent\'s custom photo library or the built-in 500-item
library). Child labels it verbally or selects the label from a 2--4
option array. Correct: label animates onto the object. This directly
trains G (Tacting).

**STAGE 2 --- BUILD IT (Syntax):** The same object is shown. Word chips
appear at the bottom: \[a/the\] \[color\] \[object\] \[doing\]. Child
drags chips to build a sentence: \'The red cup.\' or \'A big ball.\'
Sentence complexity scales with level. Targets J (Syntax & Grammar).

**STAGE 3 --- FOLLOW IT (Receptive):** The app gives a spoken
instruction: \'Touch the napkin,\' \'Find the cup,\' or \'Put the spoon
next to the bowl.\' Child must physically locate and interact with the
real object in their environment, then tap confirm. Targets C (Receptive
Language).

**Transition between stages:** Each stage is a separate game mode that
unlocks progressively. Beginner children start at Stage 1 only. The app
recommends advancing stages based on accuracy thresholds.

**Content Library Architecture**

  --------------------- ----------- ---------------------------------------
  **Category**          **Item      **Examples**
                        Count**     

  Household Objects     120         spoon, cup, chair, fan, door, book,
                                    sock, bag

  Food & Drink          80          rice, water, mango, bread, banana,
                                    milk, egg

  Body Parts            40          hand, eye, nose, foot, ear, mouth, hair

  Clothing              40          shirt, shoes, pants, scarf, hat

  Actions               80          running, eating, sleeping, crying,
                                    laughing

  Colors & Shapes       60          red circle, blue square, big, small,
                                    round

  Parent-Uploaded       Unlimited   Photos from the child\'s own
                                    environment
  --------------------- ----------- ---------------------------------------

**Technical Specifications**

-   Photo library: 420 built-in images representing common Bengali
    household items, foods, and environments. All culturally appropriate
    for Dhaka context.

-   Voice recognition: Same Whisper/Google STT integration as Mand &
    Seek. Bengali + English bilingual recognition.

-   Spaced repetition algorithm: Items answered incorrectly reappear 2
    sessions later. Items with 3 consecutive correct answers move to
    \'mastered\' status.

-   ABLLS-R mapping: Each item in the library is tagged with its ABLLS-R
    sub-skill code. Parent dashboard shows completion % per ABLLS-R
    category.

-   Intraverbal extension (advanced): Stage 4 (unlockable) plays audio
    of a partial sentence --- \'You eat with a\...\' --- and child must
    complete it. Targets H (Intraverbals).

**Off-Screen Activities by Problem Profile**

**For Parents & Video Production Team:** Each activity below includes
complete setup instructions, step-by-step guidance, and a Video
Demonstration Guide that specifies every shot required for the in-app
instructional video library. Each activity also includes a standardized
parent tracking sheet integrated with the Neurochain session log.

+-----------------------------------------------------------------------+
| **PROBLEM PROFILE 1**                                                 |
|                                                                       |
| **Social Communication & Interaction**                                |
|                                                                       |
| Targets: ABLLS-R L, H, F, P · Theory of Mind · Peer Engagement ·      |
| Turn-Taking                                                           |
+-----------------------------------------------------------------------+

**Goal:** Help the child understand the unwritten rules of social
interaction --- turn-taking, personal space, sharing, eye contact, and
reciprocal conversation --- through structured, motivating, low-pressure
activities at home.

+-----------------------------------------------------------------------+
| **Activity 1: Emotion Puppet Theater**                                |
|                                                                       |
| Targets: Social Interaction (L), Intraverbals (H), Tacting (G) ---    |
| Theory of Mind development                                            |
+-----------------------------------------------------------------------+

**Materials Needed**

-   2 socks or paper bags

-   Markers or googly eyes (to make puppet faces)

-   Small box as a \'stage\'

-   Emotion cards printed or shown on tablet

**Step-by-Step Instructions**

1.  Create two simple sock puppets --- give each a distinct face
    expressing a different emotion (happy, sad, angry, scared).

2.  Place the cardboard box on a table as the puppet theater stage.

3.  Parent operates Puppet A and begins a short scenario: \'I wanted the
    cookie but my friend ate it.\' Ask child: \'How does Puppet A
    feel?\'

4.  Child selects the matching emotion card or names the emotion, then
    operates Puppet B to respond.

5.  Gradually increase scenario complexity: introduce turn-taking
    conflicts, sharing problems, and \'how would you feel if\...\'
    situations.

6.  After 3--4 exchanges, role-play the same scenario without puppets
    --- child and parent act it out directly.

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   INTRO SHOT (5 sec): Show materials laid out on a clean surface.   |
|     Parent\'s hands hold the two puppets up.                          |
|                                                                       |
| -   CLOSE-UP: Puppet faces clearly visible --- demonstrate making one |
|     puppet look \'sad\' and one \'happy.\'                            |
|                                                                       |
| -   SCENARIO DEMO: Film a 30-second puppet exchange demonstrating the |
|     script structure (Puppet A states problem → Child identifies      |
|     emotion → Puppet B responds).                                     |
|                                                                       |
| -   PROMPT TECHNIQUE: Film parent giving a verbal prompt (\'What is   |
|     Puppet A feeling?\') and then a gestural prompt (pointing to an   |
|     emotion card).                                                    |
|                                                                       |
| -   TRANSITION TO REAL-PLAY: Show how to remove puppets and re-do the |
|     same scenario face-to-face.                                       |
|                                                                       |
| -   TRACKING DEMO: Show parent tapping the emotion the child          |
|     identified correctly in the Neurochain app.                       |
|                                                                       |
| -   VOICE-OVER TEXT: \'Puppets reduce the social pressure. The child  |
|     practices reading emotions safely before real-world               |
|     interactions.\'                                                   |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Accuracy**           Number of emotions       Tally counter in app ---
                         correctly identified out tap ✓ or ✗ after each
                         of total presented       scenario

  **Prompt Level**       Did child need Verbal,   Select FP / PP / G / V /
                         Gestural, or no prompt?  I in session log

  **Engagement           How many minutes before  Stopwatch --- record in
  Duration**             disengagement            session notes
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **Activity 2: Turn-Taking Treasure Hunt**                             |
|                                                                       |
| Targets: Social Interaction (L), Following Routines (N), Generalized  |
| Responding (P) --- structured turn-taking in shared activity          |
+-----------------------------------------------------------------------+

**Materials Needed**

-   5--10 small household objects (toy, spoon, coin, button, sock)

-   One bag or box per player to collect items

-   Timer app or sand timer (2 minutes)

-   Simple map drawn on paper (optional)

**Step-by-Step Instructions**

7.  Hide 10 objects around one room before the activity begins.

8.  Explain the rule with a visual: First-Then board. \'First it is YOUR
    turn to search. Then it is MY turn.\'

9.  Set the 2-minute timer. Child searches and collects objects on their
    turn. Parent sits and watches (no competing).

10. When timer rings, say \'My turn now\' and swap. Child must wait and
    watch.

11. Count objects found by each player. Celebrate both results equally.

12. Debrief: \'How did it feel to wait? It was hard! You did great
    waiting.\'

13. Advance version: add a rule that each player can only pick up
    objects of one specific color --- adds rule-following and impulse
    control.

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   SETUP SHOT: Film parent hiding objects around the room quickly.   |
|     Show the First-Then board on screen.                              |
|                                                                       |
| -   TURN DEMONSTRATION: Film the full turn sequence --- child         |
|     searching (30 sec), timer ringing, parent saying \'My turn now,\' |
|     child waiting.                                                    |
|                                                                       |
| -   WAITING STRATEGY: Close-up of parent using a visual countdown     |
|     timer to show the child how long they must wait.                  |
|                                                                       |
| -   IMPULSE CONTROL MOMENT: Film a scenario where the child starts to |
|     grab during parent\'s turn. Show parent calmly redirecting with   |
|     \'Not yet --- my turn is almost done!\' without scolding.         |
|                                                                       |
| -   CELEBRATION: Show the equal celebration moment regardless of who  |
|     found more objects.                                               |
|                                                                       |
| -   VOICE-OVER: \'Turn-taking is a foundational social skill. This    |
|     hunt makes waiting concrete and rewarding.\'                      |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Waiting Compliance** Did child wait during    Yes / No per trial (3
                         parent\'s full turn      trials per session)
                         without grabbing?        

  **Prompt Level**       How much prompting was   G / V / I scale
                         needed to wait?          

  **Emotional Response** Did child tolerate not   Rate 1--5 (1=meltdown,
                         winning? Any meltdown?   5=fully calm)
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **Activity 3: Social Story Role-Play Corner**                         |
|                                                                       |
| Targets: Social Interaction (L), Intraverbals (H), Generalized        |
| Responding (P) --- applying Social Story scripts in real play         |
+-----------------------------------------------------------------------+

**Materials Needed**

-   Social Story from Neurochain app (Story Navigator game)

-   2--3 props matching the story (toy food for sharing story, ball for
    playground story)

-   A designated \'stage\' corner of the room

-   Puppet or stuffed animal as the \'friend\' character

**Step-by-Step Instructions**

14. Read the selected Social Story together using the Story Navigator
    app --- child must be calm and regulated.

15. Discuss the story: \'What did \[character\] do when their friend
    wanted the toy?\' Verify comprehension with 2--3 questions.

16. Set up the physical corner with the matching props. Assign roles:
    child is themselves, stuffed animal/puppet is \'the friend.\'

17. Parent narrates the scenario as it begins: \'Now you and Bunny are
    both at the table and you BOTH want the red crayon\...\'

18. Let the child respond naturally. If they grab or show the target
    behavior, gently pause: \'What does our story say to try?\'

19. After a successful run, praise specifically: \'You asked Bunny. That
    was exactly right!\'

20. Run the scenario 3 times, gradually reducing parent narration
    support.

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   READING SETUP: Film parent and child reading the Social Story on  |
|     the tablet, child seated and calm.                                |
|                                                                       |
| -   COMPREHENSION CHECK: Film parent asking \'What did the character  |
|     do?\' --- capture child responding.                               |
|                                                                       |
| -   PROP SETUP: Quick 10-second shot of parent setting up the         |
|     physical corner with props.                                       |
|                                                                       |
| -   CORRECT RESPONSE: Film a full role-play sequence where child      |
|     successfully uses the target behavior from the story.             |
|                                                                       |
| -   REDIRECT TECHNIQUE: Film a scenario where the child shows the     |
|     problem behavior, and parent gently pauses with the story cue.    |
|                                                                       |
| -   3-TRIAL FADE: Film trial 1 (full narration) → trial 2 (less       |
|     narration) → trial 3 (independent) to show support fading.        |
|                                                                       |
| -   VOICE-OVER: \'Role-play after a Social Story bridges the gap      |
|     between understanding a rule and actually using it.\'             |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Target Behavior**    Did child use the        Yes / Partial / No per
                         story\'s directive       trial
                         behavior in role-play?   

  **Prompt Required**    Did parent need to cue   V (verbal story cue) / G
                         the story rule?          (point to prop) / I
                                                  (independent)

  **Generalization**     Did child use the        Parent notes ---
                         behavior in a real       freetext log
                         situation that week?     
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **Activity 4: Mirror Copy-Me Game**                                   |
|                                                                       |
| Targets: Motor Imitation (D), Social Interaction (L), Vocal Imitation |
| (E) --- reciprocal imitation and joint attention                      |
+-----------------------------------------------------------------------+

**Materials Needed**

-   One large bathroom mirror or standing mirror

-   Optional: face paints or stickers for variations

-   Drum / clapping hands for rhythm

**Step-by-Step Instructions**

21. Sit or stand face-to-face with child in front of or alongside the
    mirror.

22. Start with simple, slow physical movements: raise right hand, pat
    head, wave, clap. Child mirrors.

23. Add facial expressions: big smile, big eyes, pursed lips. Child
    mirrors in the mirror.

24. Add vocal elements: make a sound (\'oooh!\', \'aah!\', \'brrr!\'),
    then child echoes.

25. Switch roles: child leads a movement, parent mirrors. This is
    critical for social reciprocity.

26. Progress to 2-step sequences: clap + spin. Child must hold the
    sequence in memory.

27. End with a \'freeze\' game: make a silly pose and hold it for 5
    seconds, child freezes too.

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   FACE-TO-FACE POSITION: Film parent and child seated facing the    |
|     mirror. Show both faces clearly.                                  |
|                                                                       |
| -   BASIC IMITATION: Film 3--4 simple motor imitation exchanges       |
|     (raise hand, pat head, wave).                                     |
|                                                                       |
| -   VOCAL IMITATION: Close-up of parent making a distinct sound and   |
|     child echoing --- capture the vocal exchange.                     |
|                                                                       |
| -   ROLE SWAP: Film the moment parent says \'Now YOU lead\' and waits |
|     for child to initiate a movement.                                 |
|                                                                       |
| -   FREEZE POSE: End video with the freeze game --- silly pose, both  |
|     hold it, then laugh.                                              |
|                                                                       |
| -   VOICE-OVER: \'Imitation is the earliest building block of social  |
|     learning. Both motor and vocal imitation train the child to pay   |
|     attention to others as communication partners.\'                  |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Imitation Accuracy** Correct motor imitation  Tally ✓/✗ per trial in
                         out of 10 trials         app

  **Vocal Echo**         Number of vocal          Tally in session log
                         imitations out of 5      
                         attempts                 

  **Role Reversal**      Did child initiate a     Yes / with prompt / No
                         movement when it was     
                         their turn to lead?      
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **Activity 5: First-Then Friend Play**                                |
|                                                                       |
| Targets: Manding (F), Social Interaction (L), Following Routines (N)  |
| --- structured joint play with communication embedded                 |
+-----------------------------------------------------------------------+

**Materials Needed**

-   2 different toys the child enjoys

-   First-Then visual board (printout or app)

-   5-minute sand timer or phone timer

**Step-by-Step Instructions**

28. Set up two toys: one the child highly prefers, one moderately liked.

29. Show the First-Then board: \'First we play with \[moderate toy\]
    together. Then you get \[preferred toy\].\'

30. Play with the moderate toy together for 5 minutes. Follow the
    child\'s lead but insert prompts: \'My turn?\' \'Can I have it?\'
    \'Roll it to me!\'

31. When timer ends, honor the promise immediately: hand over the
    preferred toy. This builds trust in the system.

32. While playing with preferred toy, model parallel play and narrate
    what you\'re doing (\'I\'m building a tower!\').

33. Encourage child to comment on your play: \'What am I making?\' ---
    target intraverbal commenting.

34. End session with: \'We played together! That was fun.\' Shake hands
    or high-five --- a social ritual closer.

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   FIRST-THEN BOARD SETUP: Film parent pointing to each image on the |
|     board and explaining it simply.                                   |
|                                                                       |
| -   STRUCTURED JOINT PLAY: Film a 60-second clip of the moderate toy  |
|     play --- show parent inserting communication prompts naturally.   |
|                                                                       |
| -   PROMISE KEPT: Film the exact moment the timer rings and parent    |
|     hands over the preferred toy without delay. Caption: \'Always     |
|     honor the First-Then promise. Trust is the foundation.\'          |
|                                                                       |
| -   PARALLEL PLAY NARRATION: Film parent narrating their own play     |
|     while child plays nearby (\'Look, I\'m stacking the blocks!\').   |
|                                                                       |
| -   SOCIAL CLOSER: Film the handshake or high-five routine at the end |
|     of play.                                                          |
|                                                                       |
| -   VOICE-OVER: \'The First-Then structure makes the social demand    |
|     predictable. Predictability reduces anxiety and opens the door    |
|     for engagement.\'                                                 |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Joint Attention      How many times did child Frequency count ---
  Moments**              look at parent or shared tally in app
                         object during play?      

  **Communication Bids** How many times did child Frequency count
                         initiate communication   
                         (words, gestures, eye    
                         contact)?                

  **Compliance with      Did child transition     Yes / prompt needed / No
  First-Then**           from first activity      (meltdown)
                         without meltdown?        
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **PROBLEM PROFILE 2**                                                 |
|                                                                       |
| **Sensory Processing**                                                |
|                                                                       |
| Targets: Vestibular System · Proprioceptive System · Tactile          |
| Processing · Sensory Diet Implementation                              |
+-----------------------------------------------------------------------+

**Goal:** Provide a structured \'Sensory Diet\' --- a daily schedule of
targeted sensory experiences --- using zero-cost household materials to
replicate the neurological effects of clinical OT equipment such as
platform swings, therapy barrels, and deep-pressure crash pads.

+-----------------------------------------------------------------------+
| **Activity 1: Laundry Basket Boat Ride**                              |
|                                                                       |
| Targets: Vestibular System (linear + rotational input), Core Balance, |
| Bilateral Coordination                                                |
+-----------------------------------------------------------------------+

**Materials Needed**

-   1 large plastic laundry basket

-   Smooth floor surface (tile or hardwood)

-   A ball or toy items to throw from the basket

-   Optional: yarn or string for \'spider web\' obstacle

**Step-by-Step Instructions**

35. Place child inside the laundry basket. Ensure the basket is large
    enough that the child sits comfortably with legs crossed.

36. Parent holds the basket handles and slides it slowly across the
    floor in a straight line (linear vestibular input). Perform 5 linear
    passes.

37. Then switch to slow, controlled circular movements --- 3 clockwise,
    3 counterclockwise. PAUSE between each rotation to allow the
    vestibular system to settle. Never spin rapidly.

38. Add a bilateral task: place 5 small objects inside the basket; child
    must throw them into a target (laundry pile, box) using both hands.

39. Spider web extension: string yarn across the top of the basket in a
    criss-cross pattern. Child must retrieve objects from the basket
    bottom without touching the yarn --- targets motor planning.

40. Oar extension: give child empty paper towel rolls as \'oars.\' They
    push themselves across the floor, crossing the body\'s midline.

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   SAFETY SHOT: Film parent showing the basket is stable on smooth   |
|     floor. Demonstrate proper holding position.                       |
|                                                                       |
| -   LINEAR PASS: Film one full slow linear pass --- capture child\'s  |
|     face for regulation response (looking calm and engaged is the     |
|     goal).                                                            |
|                                                                       |
| -   ROTATION TECHNIQUE: Film slow rotation with clear PAUSE between   |
|     directions. On-screen text: \'Always pause between rotational     |
|     directions.\'                                                     |
|                                                                       |
| -   BILATERAL THROW TASK: Film child throwing objects from basket     |
|     into a target box.                                                |
|                                                                       |
| -   SPIDER WEB CHALLENGE: Quick setup and one trial with child        |
|     navigating the yarn web.                                          |
|                                                                       |
| -   POST-ACTIVITY OBSERVATION: Film child 2 minutes after activity.   |
|     Caption: \'A well-regulated child will often appear calmer and    |
|     more focused after vestibular input.\'                            |
|                                                                       |
| -   VOICE-OVER: \'The laundry basket replicates the platform swing.   |
|     Slow linear movement is calming. Rotation is alerting. Match the  |
|     input to the child\'s need.\'                                     |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Regulation State     Rate child\'s activation Slider in app
  Before**               level 1--5 before        (1=lethargic,
                         activity                 5=hyperactive)

  **Regulation State     Rate child\'s activation Slider in app ---
  After**                level 1--5 after         compare to \'before\'
                         activity                 

  **Tolerance Duration** How many minutes before  Stopwatch
                         child requested to exit? 
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **Activity 2: Rice Bin Excavation**                                   |
|                                                                       |
| Targets: Tactile Processing (desensitization), Fine Motor Skills (Z), |
| Hand-Eye Coordination                                                 |
+-----------------------------------------------------------------------+

**Materials Needed**

-   Large container or basin (at least 30cm wide)

-   1--2 kg dry rice, dried beans, or lentils

-   10--12 small toy items to hide (coins, small toys, buttons)

-   Tweezers or spoons (optional, for fine motor grading)

**Step-by-Step Instructions**

41. Fill the container with the dry rice/beans to a depth of
    approximately 10 cm.

42. While the child is not watching, hide all small items buried
    throughout the bin.

43. For a child with tactile defensiveness (avoids touching textures):
    begin with the child using a spoon to dig. Do not force bare-hand
    contact.

44. Gradually encourage the child to use one finger, then a whole hand
    over multiple sessions.

45. Give the child a \'treasure map\' (simple drawing of 3 Xs) and
    prompt them to find the hidden items.

46. Advanced level: sort retrieved items by category (toys vs coins vs
    buttons) into separate bowls --- adds cognitive sorting to the
    tactile input.

47. Grading tool: use tweezers to retrieve small items --- builds grip
    strength and precision.

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   DESENSITIZATION GRADING: Film the progression --- spoon first,    |
|     then one finger, then full hand. Label each stage clearly on      |
|     screen.                                                           |
|                                                                       |
| -   HIDING SETUP: Quick overhead shot of parent hiding items in the   |
|     rice.                                                             |
|                                                                       |
| -   TACTILE-DEFENSIVE CHILD: Film an example of a child hesitating,   |
|     and show parent giving slow, patient encouragement without        |
|     forcing contact.                                                  |
|                                                                       |
| -   SORTING EXTENSION: Film the sorting task --- child placing items  |
|     into three separate bowls by category.                            |
|                                                                       |
| -   TWEEZERS GRIP: Close-up of child using tweezers to retrieve a     |
|     small item from the rice.                                         |
|                                                                       |
| -   VOICE-OVER: \'Tactile defensiveness is not defiance. Each session |
|     expands the child\'s comfort zone by one small step. Celebrate    |
|     every tolerance milestone.\'                                      |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Tactile Tolerance    How did child engage     Select level in app
  Level**                with texture? (Spoon     dropdown
                         only / One finger / Full 
                         hand)                    

  **Time in Bin**        Total minutes child      Stopwatch
                         engaged with the tactile 
                         bin                      

  **Items Retrieved**    How many hidden items    Tally
                         found (out of total      
                         hidden)                  
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **Activity 3: Blanket Burrito Deep Pressure**                         |
|                                                                       |
| Targets: Proprioceptive System (deep pressure, calming), Full-Body    |
| Flexion, Emotional Regulation                                         |
+-----------------------------------------------------------------------+

**Materials Needed**

-   One heavy fleece or thick blanket (the heavier the better)

-   Soft pillows (3--5)

-   Calm music or white noise (optional)

-   A specific \'Burrito Song\' or counting ritual

**Step-by-Step Instructions**

48. Lay the blanket flat on the floor. Ask the child to lie on one edge.

49. Narrate playfully: \'Time to make a \[Child\'s Name\] Burrito!\'

50. Roll the child firmly but gently into the blanket --- one complete
    roll. The child should be snug but able to breathe freely. Never
    cover the face.

51. Check in: \'Tight enough? Too tight?\' Child must be able to exit at
    any time. Use a code word (\'banana\') they can say to be
    immediately unrolled.

52. Pile 3--4 soft pillows on top of the rolled child and apply firm,
    even, flat-handed downward pressure on the back for 10 seconds.
    Release. Repeat 3 times.

53. Maintain for 2--3 minutes, talking calmly or playing quiet music.

54. Unroll and observe the child\'s regulation state. This is ideal to
    use BEFORE a demanding academic task.

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   SAFETY SETUP: Film parent demonstrating the roll technique on an  |
|     empty blanket first. Show the correct tightness --- snug but not  |
|     restrictive.                                                      |
|                                                                       |
| -   CODE WORD: Film parent teaching the \'exit code word\' (\'banana  |
|     = let me out immediately\'). On-screen text: \'Child must always  |
|     be able to exit on demand.\'                                      |
|                                                                       |
| -   PILLOW PRESSURE TECHNIQUE: Film the flat-hand downward pressure   |
|     application. Show correct hand position --- flat palms, even      |
|     pressure, NOT poking or patting.                                  |
|                                                                       |
| -   REGULATION OBSERVATION: Film child\'s face and body language      |
|     during the burrito (relaxed = working).                           |
|                                                                       |
| -   BEFORE & AFTER: Film child\'s behavior/activity level 5 minutes   |
|     before the burrito, then 5 minutes after. Contrast for parent     |
|     education.                                                        |
|                                                                       |
| -   VOICE-OVER: \'Deep pressure calms the nervous system by           |
|     activating the parasympathetic response. This is why a tight hug  |
|     feels good. The burrito makes it systematic and therapeutic.\'    |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Regulation State     Activation level 1--5    App slider
  (Before)**             before activity          

  **Regulation State     Activation level 1--5    App slider --- compare
  (After)**              after activity           

  **Duration Tolerated** How long child remained  Stopwatch
                         in the burrito           
                         comfortably              
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **Activity 4: Shaving Foam Body Map**                                 |
|                                                                       |
| Targets: Tactile Processing, Body Awareness, Proprioception (light    |
| touch desensitization)                                                |
+-----------------------------------------------------------------------+

**Materials Needed**

-   Skin-safe shaving foam (unscented preferred)

-   Large plastic tray or bathtub

-   Wet cloth for cleanup

-   Optional: food coloring to make it colorful

**Step-by-Step Instructions**

55. Use during or after bath time. Apply a dollop of shaving foam to the
    child\'s arm first --- start with the least sensitive body part.

56. Narrate body parts as you apply: \'Now I\'m putting foam on your
    HAND.\' This builds receptive vocabulary (ABLLS-R Category C)
    simultaneously.

57. Ask the child to spread the foam themselves --- promotes body
    awareness and agency.

58. Draw simple shapes on the foam on the child\'s arm using a finger:
    \'I\'m drawing a circle on your arm. Now you draw one on my arm.\'

59. For tactile-defensive children: begin with foam on the tray, child
    spreads it with hands independently before body contact.

60. Cleanup is part of the activity: child wipes foam off themselves
    with a wet cloth, naming each body part as they clean it.

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   UNSCENTED PRODUCT NOTE: Open shot of unscented shaving foam       |
|     container. Text: \'Always use unscented, skin-safe foam. Test on  |
|     a small area first.\'                                             |
|                                                                       |
| -   GRADUAL INTRODUCTION: Film the tray-first approach --- child      |
|     spreading foam on tray before body application.                   |
|                                                                       |
| -   BODY PART NARRATION: Film parent narrating (\'On your elbow!\')   |
|     while applying foam, and child pointing to or naming the part.    |
|                                                                       |
| -   SHAPE DRAWING: Close-up of drawing a circle on a foam-covered arm |
|     and child imitating.                                              |
|                                                                       |
| -   CLEANUP NAMING: Film the cleanup sequence with child wiping and   |
|     parent asking \'What are you cleaning now?\'                      |
|                                                                       |
| -   VOICE-OVER: \'Light tactile input like shaving foam activates the |
|     skin\'s sensory receptors. Over time, repeated exposure reduces   |
|     tactile defensiveness.\'                                          |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Body Parts Named**   How many body parts did  Tally per session
                         child correctly name or  
                         point to?                

  **Tactile Tolerance**  Did child accept foam    Select level
                         on: tray only / one arm  
                         / full body?             

  **Duration of          Minutes of active        Stopwatch
  Engagement**           participation            
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **Activity 5: Towel Balance Beam Walk**                               |
|                                                                       |
| Targets: Vestibular Processing (balance), Proprioception (postural    |
| control), Gross Motor (Y)                                             |
+-----------------------------------------------------------------------+

**Materials Needed**

-   3--5 large bath towels

-   A clear floor space of at least 2 meters

-   Optional: beanbag or small pillow to balance on head

-   Optional: hoops or chalk circles as \'stepping stones\'

**Step-by-Step Instructions**

61. Tightly roll each towel lengthwise into a firm cylinder. Place them
    end-to-end in a straight line.

62. Demonstrate walking heel-to-toe across the towels barefoot. Walk
    slowly and model controlled balance.

63. Child walks across the beam barefoot. The uneven, slightly unstable
    surface actively challenges balance systems.

64. Add the head-balance challenge: place a small pillow or beanbag on
    the child\'s head. Child must walk the beam without it falling.

65. Towel flip challenge: child stands on a flat (unrolled) towel and
    flips it completely over without stepping off. Requires high-level
    motor planning.

66. Add stepping stones: place chalk circles or hoops at the end of the
    beam --- child must jump from the beam end into each circle (adds
    vestibular + proprioceptive landing).

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   SETUP SHOT: Film parent rolling towels and placing them in a      |
|     line. Show the \'firm cylinder\' rolling technique for correct    |
|     preparation.                                                      |
|                                                                       |
| -   BAREFOOT TECHNIQUE: Close-up of bare feet on towel beam. Text:    |
|     \'Barefoot is essential --- it maximizes tactile and              |
|     proprioceptive feedback from the floor.\'                         |
|                                                                       |
| -   HEAD BALANCE DEMO: Film the pillow-on-head challenge. Show how it |
|     forces the child to slow down and engage core balance.            |
|                                                                       |
| -   TOWEL FLIP: Film the towel flip challenge --- show the difficulty |
|     level and celebrate when child succeeds.                          |
|                                                                       |
| -   JUMPING STONES: Film the jump-from-beam-to-circle sequence with   |
|     landing technique (bent knees).                                   |
|                                                                       |
| -   VOICE-OVER: \'Balance challenges require the brain\'s vestibular  |
|     and proprioceptive systems to communicate constantly. Each        |
|     successful crossing builds neural pathways for coordination.\'    |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Crossings            Number of successful     Tally per session
  Completed**            beam crossings without   
                         stepping off             

  **Fall/Step-Off        How many times did child Frequency count ---
  Count**                step off the beam?       track reduction over
                                                  time

  **Advanced Challenge** Did child attempt head   Yes / Attempted / Not
                         balance? Towel flip?     ready
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **PROBLEM PROFILE 3**                                                 |
|                                                                       |
| **Speech & Oral-Motor Development**                                   |
|                                                                       |
| Targets: Jaw Grading · Lip Closure · Tongue Dissociation · Breath     |
| Support · Articulation                                                |
+-----------------------------------------------------------------------+

**Goal:** Replicate the biomechanical principles of TalkTools Oral
Placement Therapy (OPT) using safe household items and food. All
exercises build specific oral-motor muscle groups required for speech
clarity, saliva control, and safe eating. Daily practice of 5--10
minutes is essential for muscle memory development.

+-----------------------------------------------------------------------+
| **Activity 1: DIY Button Pull (Lip Closure & Strength)**              |
|                                                                       |
| Targets: Orbicularis Oris Muscle (lip seal), Lip Rounding, Labial     |
| Sound Production (/p/, /b/, /m/), Drooling Reduction                  |
+-----------------------------------------------------------------------+

**Materials Needed**

-   1 large flat button (2--3 cm diameter), clean and sanitized

-   30 cm of dental floss or strong string

-   Mirror (essential for visual feedback)

**Step-by-Step Instructions**

67. Thread the dental floss through the button\'s holes and tie a secure
    double knot. Test it by pulling firmly.

68. Child sits at a table in correct posture: ankles, knees, and hips at
    90°. Feet flat on the floor. Head and body must remain still
    throughout.

69. STEP 1 --- Hold & Squeeze: Place the button INSIDE the child\'s
    lips, centered at the midline, in front of the teeth (never behind).
    Instruct: \'Close your lips and squeeze the button. Don\'t let it
    come out!\' Hold 10--15 seconds. Rest. Repeat 3 times.

70. STEP 2 --- Tug & Hold: Once the child can maintain the lip seal,
    gently pull the string outward to provide resistance. Make it a
    game: \'Don\'t let me win!\' Hold the gentle tension for 10--15
    seconds. Rest. Repeat 3 times.

71. STEP 3 --- Corner Work: Move the button to the right corner of the
    lips. Repeat the tug exercise. Then move to the left corner. Pay
    extra attention to whichever side is weaker.

72. Always use a mirror. The child watches their own lip seal in the
    mirror --- this provides critical biofeedback.

73. Progress goal: move to smaller buttons as lip strength increases.

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   POSTURE CHECK: Film the correct 90-90-90 sitting posture from the |
|     side. Text overlay: \'Correct posture ensures the lips do all the |
|     work, not the neck or jaw.\'                                      |
|                                                                       |
| -   BUTTON PLACEMENT: Close-up of correct button placement --- inside |
|     the lips, in front of teeth, at the midline.                      |
|                                                                       |
| -   HOLD & SQUEEZE: Film the 15-second hold with a visible timer.     |
|     Show child\'s lips maintaining the seal.                          |
|                                                                       |
| -   TUG TECHNIQUE: Film the gentle tug --- show the string angle      |
|     (straight outward, not up or down) and the \'don\'t let me win\'  |
|     framing.                                                          |
|                                                                       |
| -   CORNER WORK: Film moving the button to the right corner, then     |
|     left corner. Caption: \'The weaker corner needs more              |
|     repetitions.\'                                                    |
|                                                                       |
| -   MIRROR FEEDBACK: Film child watching their own lips in the mirror |
|     during the exercise.                                              |
|                                                                       |
| -   VOICE-OVER: \'The orbicularis oris is the ring of muscle around   |
|     the lips. A weak lip seal causes drooling, unclear /p/b/m/        |
|     sounds, and food loss during eating. The button pull is the most  |
|     efficient exercise to build this seal.\'                          |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Hold Duration**      How many seconds did     Stopwatch --- record per
                         child maintain lip seal  trial
                         without button slipping? 

  **Tug Resistance**     Could child resist       Yes / partial / No
                         gentle tug for 10+       
                         seconds?                 

  **Symmetry**           Was one corner weaker?   Observe and note in
                         (Left / Right / Equal)   session log
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **Activity 2: Peanut Butter Tongue Climb**                            |
|                                                                       |
| Targets: Tongue Tip Elevation, Tongue Strength Against Gravity,       |
| Alveolar Sound Production (/t/, /d/, /n/, /l/)                        |
+-----------------------------------------------------------------------+

**Materials Needed**

-   Peanut butter, Nutella, or marshmallow fluff (one preferred by
    child)

-   Small spoon or butter knife for application

-   Mirror

-   Wet cloth for cleanup

**Step-by-Step Instructions**

74. Use the handle of a small spoon or a clean finger to place a small
    dab of peanut butter on the child\'s ALVEOLAR RIDGE --- the bumpy
    ridge on the roof of the mouth just behind the top front teeth.

75. Instruct: \'There\'s a secret hiding up there! Can your tongue tip
    find it and scrape it off?\'

76. Critical: the child must use the TIP of the tongue only --- not the
    flat middle. Model this yourself first.

77. The child raises the tongue tip and scrapes the food off the ridge
    --- repeat 5 times per session.

78. Use the mirror so the child can watch their tongue tip elevate.

79. Tongue lateralization extension: place a small dab in the right
    cheek corner and instruct child to sweep their tongue to retrieve
    it. Then left corner. This trains lateral tongue movement for
    chewing.

80. Jaw dissociation check: ask the child to hold their jaw very still
    and ONLY move the tongue. If the jaw moves with the tongue, gently
    stabilize the jaw with your clean hand.

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   ANATOMY SHOT: Use a simple mouth diagram (printout or tablet      |
|     display) to show the alveolar ridge before beginning. Caption:    |
|     \'This is where the tongue goes for T, D, N, L sounds.\'          |
|                                                                       |
| -   PLACEMENT DEMO: Close-up of parent applying a tiny dab in the     |
|     correct location (ridge, not palate center).                      |
|                                                                       |
| -   TONGUE TIP TECHNIQUE: Film child performing the scrape. Circle    |
|     the tongue tip in the video editing to highlight correct          |
|     movement.                                                         |
|                                                                       |
| -   JAW STILL CHECK: Film parent gently holding the child\'s jaw and  |
|     instructing tongue-only movement. Caption: \'The jaw and tongue   |
|     must learn to move independently.\'                               |
|                                                                       |
| -   LATERALIZATION EXTENSION: Film the cheek-corner dab placement and |
|     lateral sweep on both sides.                                      |
|                                                                       |
| -   VOICE-OVER: \'Tongue tip elevation is required for T, D, N, and L |
|     sounds. If the tongue cannot reach the alveolar ridge             |
|     independently, these sounds will be distorted or substituted.\'   |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Tongue Tip           Did child reach the      Correct / Approximate /
  Accuracy**             alveolar ridge (vs. flat Incorrect per trial
                         tongue on palate)?       

  **Jaw Independence**   Did jaw remain still     Yes / Jaw moved / Could
                         while tongue moved?      not dissociate

  **Lateralization       Could child sweep to     Both / Right only / Left
  (L/R)**                both corners?            only / Neither
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **Activity 3: Bubble Mountain (Lip Seal + Breath Support)**           |
|                                                                       |
| Targets: Labial Seal (lip closure around straw), Breath Support,      |
| Cheek Muscle Activation, Sustained Exhalation                         |
+-----------------------------------------------------------------------+

**Materials Needed**

-   Shallow tray or large bowl

-   Dish soap or baby shampoo

-   Straws (start wide, progress to narrow)

-   Optional: food coloring to make bubbles colorful

-   Mirror or phone camera

**Step-by-Step Instructions**

81. Fill the tray with 2 cm of water and add a generous squeeze of dish
    soap. Mix gently.

82. Demonstrate: place the straw in the liquid and blow steadily through
    it to create a bubble mountain. Keep blowing until the mountain
    overflows the tray.

83. Child takes the straw. Key instruction: \'Seal your lips around the
    straw like you\'re kissing it. No air should escape the sides.\'

84. Start with a wide straw (smoothie straw or thick boba straw). Wide
    straws require less effort.

85. Straw hierarchy progression (over multiple sessions): wide boba
    straw → standard drinking straw → cocktail straw → bendy/squiggly
    straw. Each step increases oral-motor demand.

86. Endurance challenge: how tall can the bubble mountain grow before it
    collapses? This motivates sustained, controlled breath.

87. Sucking extension: after blowing, use the straw to suck up colored
    water into a separate cup --- targets the same lip seal from the
    opposite direction.

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   LIP SEAL CLOSE-UP: Film child\'s lip seal around the straw --- no |
|     air gaps on the sides. Incorrect technique (air escaping) shown   |
|     side-by-side for comparison.                                      |
|                                                                       |
| -   BUBBLE MOUNTAIN BUILD: Time-lapse or real-time filming of the     |
|     mountain growing. Keeps child motivated visually.                 |
|                                                                       |
| -   STRAW HIERARCHY: Film the 4 straws in order of difficulty. Quick  |
|     demonstration of effort required for each.                        |
|                                                                       |
| -   ENDURANCE CHALLENGE: Film a 30-second continuous blow. Caption:   |
|     \'Goal: 30 unbroken seconds of sustained exhalation.\'            |
|                                                                       |
| -   SUCKING EXTENSION: Film child sucking liquid up through straw     |
|     into a separate cup. Caption: \'Sucking and blowing use the same  |
|     labial and cheek muscles from opposite directions.\'              |
|                                                                       |
| -   VOICE-OVER: \'Breath support is the power behind speech. A child  |
|     who cannot sustain exhalation will have weak, breathy voice       |
|     quality and short utterance length.\'                             |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Lip Seal Quality**   Was seal maintained (no  Correct / Partial /
                         air escaping sides)?     Incorrect per trial

  **Sustained Blow       Longest unbroken blow in Stopwatch --- record
  Duration**             seconds                  longest attempt

  **Straw Level          Which straw on the       Select from dropdown:
  Achieved**             hierarchy was used this  Boba / Standard /
                         session?                 Cocktail / Squiggly
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **Activity 4: Lollipop Stretch (Tongue Lateralization & Range)**      |
|                                                                       |
| Targets: Tongue Range of Motion, Lateralization, Protrusion and       |
| Elevation (prerequisite for /l/, /r/ articulation)                    |
+-----------------------------------------------------------------------+

**Materials Needed**

-   1--2 lollipops or firm candy on a stick (child\'s preferred flavor)

-   Mirror

**Step-by-Step Instructions**

88. Child sits facing the mirror at table height. Parent stands to the
    side holding the lollipop.

89. Protrusion: hold the lollipop directly in front of the child\'s
    mouth, 3 cm away. Prompt: \'Stretch your tongue out and touch it!\'
    Do not move the lollipop toward the child\'s mouth --- they must
    reach for it.

90. Elevation: hold the lollipop above the child\'s upper lip. Prompt:
    \'Can your tongue reach up to lick it?\' This trains upward tongue
    range.

91. Lateralization Right: hold the lollipop to the right corner of the
    mouth. Child stretches tongue to touch it.

92. Lateralization Left: repeat on the left side. Note which side has
    reduced range.

93. Depression (downward range): hold the lollipop below the lower lip.
    Child stretches tongue downward.

94. Progress to faster transitions: quickly alternate lollipop position
    Left → Right → Up → Down in a random order. Child\'s tongue must
    track and follow.

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   REACH, DON\'T GIVE: Film the correct technique --- lollipop stays |
|     stationary; tongue reaches forward. Caption: \'The lollipop does  |
|     not move to the child. The tongue moves to the lollipop.\'        |
|                                                                       |
| -   4-DIRECTION DEMONSTRATION: Film all four directions (forward, up, |
|     right, left) clearly labeled on screen.                           |
|                                                                       |
| -   RANGE MEASUREMENT PROXY: Place a ruler or your finger at the edge |
|     of the lips to visually show how far the tongue protrudes.        |
|                                                                       |
| -   WEAK SIDE FOCUS: Film spending extra time on the weaker side.     |
|     Caption: \'The side with reduced range needs twice as many        |
|     repetitions.\'                                                    |
|                                                                       |
| -   TRACKING SEQUENCE: Film the fast random sequence with parent      |
|     quickly moving the lollipop and child\'s tongue following.        |
|                                                                       |
| -   VOICE-OVER: \'Limited tongue range directly impacts articulation  |
|     clarity and the ability to clear food from inside the cheeks      |
|     during eating.\'                                                  |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Protrusion           Did tongue fully         Full / Partial / Tip
  Distance**             protrude past the lip    only
                         line?                    

  **Lateralization**     Could tongue reach fully Both / Right weak / Left
                         to both corners?         weak / Neither

  **Tracking Speed**     Could child track random 3 consecutive correct /
                         fast direction changes?  1--2 / Could not track
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **Activity 5: Mirror Speech Station (Articulation Practice)**         |
|                                                                       |
| Targets: Vocal Imitation (E), Articulation Accuracy, Self-Monitoring, |
| Sound-Word Generalization                                             |
+-----------------------------------------------------------------------+

**Materials Needed**

-   One large mirror (bathroom mirror or standing mirror)

-   20--30 flashcards or photos of objects containing target sounds

-   A simple reward chart

**Step-by-Step Instructions**

95. Identify the child\'s target speech sound(s) from the therapist\'s
    report (e.g., /b/, /p/, /t/). Focus on ONE sound per session.

96. Child sits directly facing the mirror. Parent sits beside the child
    (also visible in the mirror).

97. Parent produces the target sound clearly and slowly, with
    exaggerated mouth movements visible in the mirror: \'/b/ - /b/ -
    ball.\'

98. Child watches parent\'s mouth in the mirror and attempts to imitate
    the sound and word.

99. Hold up a flashcard of an object containing the sound. Child names
    the object in the mirror, watching their own mouth.

100. If the child produces the sound incorrectly, model it again with a
     tactile cue: gently press the child\'s lips together and release
     for /b/, or tap the alveolar ridge for /t/.

101. Reward chart: after 5 correct productions in a row, child places a
     sticker on the chart.

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   MIRROR POSITION: Film the ideal sitting position --- both parent  |
|     and child faces clearly visible in the mirror. Text: \'The child  |
|     watches your mouth AND their own mouth simultaneously.\'          |
|                                                                       |
| -   SOUND PRODUCTION DEMO: Extreme close-up of parent\'s mouth        |
|     producing /b/. Slow motion if possible. Caption: \'Exaggerated,   |
|     slow mouth movements give the child more visual information.\'    |
|                                                                       |
| -   TACTILE CUE TECHNIQUE: Film the gentle lip-press cue for /b/ and  |
|     the ridge-tap cue for /t/. Text: \'Tactile cues tell the body     |
|     what the ears and eyes cannot.\'                                  |
|                                                                       |
| -   FLASHCARD NAMING: Film a rapid 5-card naming session (child names |
|     each object with target sound).                                   |
|                                                                       |
| -   REWARD CHART STICKER: Film the moment child places a sticker on   |
|     the chart after 5 correct productions.                            |
|                                                                       |
| -   VOICE-OVER: \'The mirror turns speech therapy into a biofeedback  |
|     loop. The child learns to monitor their own production by         |
|     watching themselves, building the self-awareness required for     |
|     long-term carryover.\'                                            |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Correct              Number of correct target Accuracy % = correct ÷
  Productions**          sound productions out of total × 100
                         total attempts           

  **Cue Required**       What cue level was       Select from dropdown
                         needed? (Model only /    
                         Tactile + model /        
                         Tactile only /           
                         Independent)             

  **Generalization**     Did child use the target Yes / 1--2 times / No
                         sound correctly in       
                         spontaneous conversation 
                         today?                   
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **PROBLEM PROFILE 4**                                                 |
|                                                                       |
| **Motor Skills (Gross & Fine)**                                       |
|                                                                       |
| Targets: ABLLS-R Y (Gross Motor) · Z (Fine Motor) · Bilateral         |
| Coordination · Grip Strength · Hand-Eye Coordination                  |
+-----------------------------------------------------------------------+

**Goal:** Build both gross motor coordination (the large movements
required for physical navigation, sports, and play) and fine motor
dexterity (the precise finger and hand movements required for writing,
dressing, and tool use) through structured household-based activities.

+-----------------------------------------------------------------------+
| **Activity 1: Animal Walk Circuit**                                   |
|                                                                       |
| Targets: Gross Motor (Y), Bilateral Coordination, Upper Body          |
| Proprioception, Motor Imitation (D)                                   |
+-----------------------------------------------------------------------+

**Materials Needed**

-   Clear floor space (2m × 2m minimum)

-   Painter\'s tape or chalk to mark a circuit path

-   4--5 \'station\' signs (simple drawings of animals)

-   Optional: a drum or clapping rhythm for pacing

**Step-by-Step Instructions**

102. Use tape to create a simple circuit path on the floor: a rectangle
     or winding track with 4--5 stations marked.

103. At each station, place a sign with an animal drawing and the
     corresponding walk name.

104. Stations: (1) Bear Crawl --- on hands and feet, hips high, walk
     forward; (2) Crab Walk --- on hands and feet, belly up, walk
     sideways; (3) Frog Jump --- squat low, jump forward with both feet
     landing simultaneously; (4) Elephant Walk --- bend forward at the
     waist, swing both arms as a \'trunk\'; (5) Inchworm --- start
     standing, walk hands to plank, then walk feet to hands.

105. Parent demonstrates each station once. Child follows the circuit.

106. Use a drum or clapping to set the pace --- this adds rhythm
     processing to the motor task.

107. Record lap times and try to improve each session. Compare \'Week
     1\' to \'Week 4\' for visible progress.

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   STATION SIGNS: Film quick overhead shot of each station sign.     |
|     Parent points to the animal and demonstrates the walk.            |
|                                                                       |
| -   EACH ANIMAL WALK DEMO: Film parent performing each walk perfectly |
|     with clear narration. Bear crawl = hips HIGH. Crab walk = belly   |
|     UP.                                                               |
|                                                                       |
| -   BILATERAL EMPHASIS: Film the frog jump in slow motion --- both    |
|     feet landing simultaneously. Caption: \'Simultaneous bilateral    |
|     landing is a key developmental milestone.\'                       |
|                                                                       |
| -   INCHWORM DEMO: Film the full inchworm sequence step-by-step ---   |
|     it is the most complex and requires careful instruction.          |
|                                                                       |
| -   CIRCUIT RUN: Film child completing the full circuit once.         |
|     Celebrate at the finish line.                                     |
|                                                                       |
| -   VOICE-OVER: \'Animal walks provide heavy proprioceptive input     |
|     while building the gross motor patterns required for playground   |
|     activities, running, and physical education.\'                    |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Circuit Completion** Did child complete all 5 Yes / skipped N stations
                         stations without         / Not ready
                         skipping?                

  **Walk Quality**       Rate quality of each     Rate each walk
                         animal walk (1--3: needs separately in session
                         support / emerging /     log
                         independent)             

  **Lap Time**           How long to complete one Stopwatch --- track
                         circuit?                 improvement over weeks
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **Activity 2: Clothespin Laundry Challenge**                          |
|                                                                       |
| Targets: Fine Motor Skills (Z), Grip Strength, Pincer Grasp,          |
| Bilateral Hand Use, Hand-Eye Coordination                             |
+-----------------------------------------------------------------------+

**Materials Needed**

-   10--15 clothespins (standard spring-clip type)

-   A length of rope or cord strung at child\'s shoulder height

-   10--15 small items to hang (socks, washcloths, small fabric pieces)

-   A basket to hold the items

**Step-by-Step Instructions**

108. String the rope between two chairs or door handles at child\'s
     shoulder height.

109. Place the clothespins in a basket beside the basket of items.

110. Demonstrate: pick up one sock, hold it at the rope, use two fingers
     and a thumb to open a clothespin and clip it on.

111. Child hangs each item using a clothespin. This requires coordinated
     bilateral hand use (one hand holds fabric, other hand clips).

112. Grading (easier): for weak grip, pre-open clothespins slightly and
     ask child to squeeze them shut --- reduces opening force.

113. Grading (harder): use tighter clothespins; add a sorting rule
     (\'only hang red items in this section\').

114. Timer challenge: how many items can be hung in 2 minutes? Race
     against your own previous record.

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   BILATERAL HAND COORDINATION: Film both hands in close-up --- left |
|     hand holds fabric to rope, right hand clips clothespin. Caption:  |
|     \'Two hands, two jobs, at the same time.\'                        |
|                                                                       |
| -   PINCER GRASP CLOSE-UP: Extreme close-up of the thumb-index-middle |
|     finger pincer on the clothespin.                                  |
|                                                                       |
| -   GRADING DOWN: Film pre-opened clothespin technique for children   |
|     with grip weakness.                                               |
|                                                                       |
| -   SORTING EXTENSION: Film the color-sort rule in action --- child   |
|     actively scanning for the correct colored item.                   |
|                                                                       |
| -   TIMER CHALLENGE: Film the 2-minute timer challenge. Create        |
|     visible excitement and celebrate the \'personal best.\'           |
|                                                                       |
| -   VOICE-OVER: \'Grip strength and pincer grasp are the foundation   |
|     for writing, cutting, and self-care tasks. Every clothespin is a  |
|     targeted hand strengthening repetition.\'                         |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Items Hung           Number clipped on rope   Count per session ---
  Correctly**            without falling in       track improvement
                         2-minute window          

  **Grip Independently** Did child open           Yes / Needed pre-open /
                         clothespin independently Could not do
                         (no pre-opening)?        

  **Bilateral            Did child use both hands Yes / One hand only
  Coordination**         simultaneously?          (draped on rope) / No
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **Activity 3: Rice Spoon Transfer**                                   |
|                                                                       |
| Targets: Fine Motor Skills (Z), Grading of Force, Wrist Rotation,     |
| Hand-Eye Coordination, Midline Crossing                               |
+-----------------------------------------------------------------------+

**Materials Needed**

-   2 identical bowls

-   Rice, lentils, or small beads

-   1 teaspoon (start), 1 tablespoon (progress)

-   Optional: tweezers for advanced level

-   Timer

**Step-by-Step Instructions**

115. Fill the left bowl with 1 cup of rice. Place the empty bowl on the
     right.

116. Child\'s task: transfer ALL the rice from the left bowl to the
     right bowl using only the spoon --- without spilling.

117. The critical skill: grading force --- scooping just the right
     amount so it stays on the spoon, moving smoothly without jerking.

118. Start with a tablespoon (larger, easier to balance). Progress to
     teaspoon. Progress to a chopstick (if culturally appropriate) or
     tweezers.

119. Wrist rotation focus: ensure the child fully rotates the wrist to
     dump the rice cleanly into the second bowl (not scraping it off).

120. Midline crossing: place the source bowl to the far left and
     destination bowl to the far right, so the child must cross the
     midline with each transfer.

121. Count spills. Goal: fewer than 3 spills per full transfer. Track
     session-by-session.

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   CORRECT SCOOP TECHNIQUE: Film parent demonstrating the correct    |
|     scoop-lift-rotate-deposit sequence in slow motion. Caption: \'The |
|     wrist must rotate to release. No scraping.\'                      |
|                                                                       |
| -   SPILL COUNT: Film the parent tallying spills on a whiteboard or   |
|     notebook. Show the \'fewer than 3 spills\' target.                |
|                                                                       |
| -   MIDLINE CROSSING SETUP: Overhead shot showing the far-left /      |
|     far-right bowl placement. Body midline drawn as a dotted line     |
|     overlay in video editing.                                         |
|                                                                       |
| -   SPOON PROGRESSION: Film all 3 tools (tablespoon, teaspoon,        |
|     tweezers) side by side. Demonstrate difficulty increase.          |
|                                                                       |
| -   COUNTING SPILLS: Film the end-of-transfer review --- parent and   |
|     child count spills together on the table.                         |
|                                                                       |
| -   VOICE-OVER: \'Force grading --- knowing how hard to grip and how  |
|     smoothly to move --- is one of the most critical fine motor       |
|     skills. It underlies handwriting, eating, and tool use.\'         |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Spills Per           Number of rice           Count and record ---
  Transfer**             grains/items spilled     track reduction
                         during full bowl         
                         transfer                 

  **Spoon Level Used**   Tablespoon / Teaspoon /  Select in session log
                         Tweezers                 

  **Completion Time**    Time to transfer full    Stopwatch --- track
                         bowl                     efficiency gains
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **Activity 4: Tennis Ball Squeeze Feeder**                            |
|                                                                       |
| Targets: Grip Strength, Hand Coordination, In-Hand Manipulation,      |
| Visual-Motor Integration                                              |
+-----------------------------------------------------------------------+

**Materials Needed**

-   1 tennis ball with a 3 cm slit cut into it (parent cuts with a sharp
    blade --- adult only)

-   Small objects to feed into the slit: coins, buttons, folded paper
    squares

-   A bowl to collect items after they are inserted

-   Optional: mark the ball with two googly eyes to make it a \'mouth\'

**Step-by-Step Instructions**

122. ADULT ONLY: Before the activity, use a sharp utility blade to cut a
     3 cm straight slit in the tennis ball. Test it --- squeezing should
     open the slit like a mouth.

123. Decorate the ball with googly eyes to make it a fun \'character
     mouth.\'

124. Demonstrate: squeeze the ball with all 5 fingers to open the slit,
     hold it open, use the other hand to insert one small object into
     the opening, then release to close.

125. Child feeds each object one at a time into the \'mouth.\'

126. The squeeze requires significant hand and finger strength ---
     monitor for fatigue after 10--12 repetitions.

127. Count variations: child must only feed in items of a specific color
     or category --- adds cognitive sorting to the fine motor task.

128. Emptying: child flips the ball and squeezes over the bowl to dump
     all items out --- additional wrist and grip work.

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   ADULT-ONLY SLIT CUTTING: Film the blade cutting step. Clear text  |
|     overlay: \'ADULTS ONLY. Keep blades away from children.\'         |
|                                                                       |
| -   DECORATION: Quick shot of adding googly eyes --- makes the        |
|     activity more motivating.                                         |
|                                                                       |
| -   SQUEEZE & INSERT TECHNIQUE: Slow-motion close-up of correct       |
|     technique: 5-finger squeeze → slit opens → other hand inserts     |
|     object → release.                                                 |
|                                                                       |
| -   FATIGUE MONITORING: Film parent checking child\'s hand after 10   |
|     reps. Caption: \'Watch for shaking, dropping, or complaints. Stop |
|     at first sign of fatigue.\'                                       |
|                                                                       |
| -   SORTING RULE: Film the color-sort version --- child scanning      |
|     items and selecting only red ones to feed in.                     |
|                                                                       |
| -   VOICE-OVER: \'The tennis ball feeder isolates the intrinsic hand  |
|     muscles --- the same muscles required for writing, buttoning, and |
|     fine manipulation tasks.\'                                        |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Successful Inserts** Number of objects        Tally per session
                         correctly inserted       
                         without dropping the     
                         ball                     

  **Grip Strength**      Could child open the     Independent / Partial
                         slit independently (vs.  assist / Full assist
                         needing partially        
                         squeezed ball)?          

  **Fatigue Onset**      After how many reps did  Count --- increase
                         child show fatigue       tolerance over time
                         signs?                   
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **PROBLEM PROFILE 5**                                                 |
|                                                                       |
| **Emotional Regulation & Behavior**                                   |
|                                                                       |
| Targets: Self-Regulation · Frustration Tolerance · Transition         |
| Management · Routine Compliance · Sensory-Based Calming               |
+-----------------------------------------------------------------------+

**Goal:** Provide parents with a proactive regulatory toolkit ---
sensory, cognitive, and environmental strategies --- that prevent
behavioral escalation rather than reacting to it. The emphasis is on
building the child\'s nervous system\'s capacity for self-regulation
through consistent, predictable daily sensory and behavioral supports.

+-----------------------------------------------------------------------+
| **Activity 1: Calm-Down Corner Setup & Protocol**                     |
|                                                                       |
| Targets: Emotional Regulation, Self-Initiated Calming, Sensory        |
| Retreat, Manding for Breaks (F)                                       |
+-----------------------------------------------------------------------+

**Materials Needed**

-   A dedicated corner of the room (at least 1m × 1m)

-   A small tent, pop-up canopy, or draped blanket fort

-   3--4 regulation tools: fidget toy, stress ball, small weighted lap
    pad, chewy tube or chewy snack

-   Visual \'calm-down menu\' printed and laminated

-   Dim, warm lighting (a small lamp or fairy lights)

**Step-by-Step Instructions**

129. Set up a permanent, consistent Calm-Down Corner in the child\'s
     room or main living area. Consistency of location is critical ---
     it must always be available, never removed as punishment.

130. Furnish it with 3--4 pre-selected sensory tools that the child
     finds calming (identified through clinical assessment or parent
     observation).

131. Laminate and attach a \'Calm-Down Menu\' to the wall at child\'s
     eye level: a visual list of 4--5 options (squeeze the stress ball,
     look at the lights, take 3 big breaths, wrap in the blanket).

132. Practice using the corner during CALM times, not crisis: \'Let\'s
     go to the calm corner and see what\'s in it!\' Build positive
     associations first.

133. Teach the requesting behavior (Manding): \'When you feel angry or
     too big, you can say BREAK or show me the BREAK card to go to the
     corner.\' Reinforce every break request strongly --- this replaces
     problem behaviors.

134. After a meltdown resolves, guide the child to the corner (never
     force). Re-introduce the corner positively post-episode.

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   CORNER SETUP MONTAGE: Film the full setup process --- tent,       |
|     tools, calm menu placement, lighting. Show the final result from  |
|     child\'s eye view.                                                |
|                                                                       |
| -   CALM MENU EXPLANATION: Film parent pointing to each item on the   |
|     calm menu and demonstrating it. Caption: \'The child must know    |
|     how to use each tool BEFORE they need it.\'                       |
|                                                                       |
| -   BREAK REQUESTING: Film a rehearsal --- parent creates a mild      |
|     demand, child hands the BREAK card, parent immediately honors it  |
|     and walks child to corner. Caption: \'Honoring the break request  |
|     is non-negotiable. It teaches the child that words work.\'        |
|                                                                       |
| -   POSITIVE PRACTICE: Film a relaxed session where parent and child  |
|     sit in the corner together playfully --- building the positive    |
|     association.                                                      |
|                                                                       |
| -   NEVER REMOVE: Text screen with red border: \'NEVER remove the     |
|     calm-down corner as a punishment. It is a therapeutic tool, not a |
|     reward.\'                                                         |
|                                                                       |
| -   VOICE-OVER: \'A calm-down corner is not a timeout. It is a        |
|     regulated, sensory-safe retreat that the child chooses to use.    |
|     Teaching a child to request a break is teaching them              |
|     self-advocacy.\'                                                  |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Break Requests**     How many times did child Frequency count ---
                         independently request a  increase is the goal
                         break today?             

  **Corner Entries       Did use of the corner    Yes / Partial / No
  Prevented Escalation** prevent a full meltdown? (escalated anyway)

  **Tool Used**          Which calm-down tool did Select from dropdown:
                         child use?               blanket / fidget /
                                                  breathing / chewy /
                                                  other
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **Activity 2: Heavy Work Obstacle Course**                            |
|                                                                       |
| Targets: Proprioceptive Input (regulating), Sensory Diet, Gross Motor |
| (Y), Emotional Regulation before demanding tasks                      |
+-----------------------------------------------------------------------+

**Materials Needed**

-   Laundry basket with 3--4 heavy books inside

-   Stack of pillows or couch cushions

-   Wall space

-   Painter\'s tape circuit markings

-   Optional: a tunnel made from blanket draped over two chairs

**Step-by-Step Instructions**

135. This activity is designed as a PROACTIVE regulation strategy ---
     use it BEFORE demanding tasks (homework, transitions, mealtimes) to
     pre-load the child\'s nervous system with organizing proprioceptive
     input.

136. Set up the circuit: (Station 1) Push the loaded laundry basket
     across the carpet to the far wall (heavy work --- 3 passes).
     (Station 2) Wall push-ups --- hands flat on wall, 10 controlled
     push-ups. (Station 3) Crawl through the blanket tunnel. (Station 4)
     Crash into pillow pile 3 times.

137. Run the full circuit twice. Total time: approximately 5--7 minutes.

138. Critical observation: watch for the \'just right\' state after the
     circuit --- child appears more focused, less hyperactive, or more
     alert depending on starting state.

139. Schedule this course 3 times per day in the visual schedule:
     morning (before breakfast), midday (before learning), and evening
     (before dinner).

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   CIRCUIT OVERVIEW: Film the full setup from above. Number each     |
|     station clearly with tape labels.                                 |
|                                                                       |
| -   EACH STATION DEMO: Film each station with correct technique.      |
|     Heavy push: lean into the basket, use full body. Wall push-up:    |
|     straight body line, controlled movement.                          |
|                                                                       |
| -   PROACTIVE FRAMING: Text overlay: \'Use BEFORE demands, not AFTER  |
|     meltdowns.\' Parent sets up the circuit 10 minutes before         |
|     homework time.                                                    |
|                                                                       |
| -   BEFORE & AFTER FOCUS: Film child attempting a simple puzzle       |
|     BEFORE the circuit (distracted, hyperactive). Then film the same  |
|     puzzle AFTER the circuit (more focused). Dramatic and persuasive  |
|     demonstration.                                                    |
|                                                                       |
| -   SCHEDULING: Film parent marking the circuit times on the visual   |
|     schedule app.                                                     |
|                                                                       |
| -   VOICE-OVER: \'Heavy work --- pushing, pulling, carrying, and      |
|     crashing --- tells the nervous system where the body is in space. |
|     This organizing input reduces sensory-seeking hyperactivity and   |
|     improves the capacity to focus.\'                                 |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Regulation (Before   Activation level 1--5    App slider
  Circuit)**             before circuit           

  **Regulation (After    Activation level 1--5    App slider --- compare
  Circuit)**             after circuit            

  **Focus Duration       How many minutes of      Stopwatch --- record and
  Post-Circuit**         focused task engagement  track increase
                         followed the circuit?    
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **Activity 3: Visual Schedule Quest**                                 |
|                                                                       |
| Targets: Following Routines (N), Transition Compliance, Anxiety       |
| Reduction, Independence in Self-Help (U, V, W)                        |
+-----------------------------------------------------------------------+

**Materials Needed**

-   Visual Schedule App (Choiceworks, Hearth Calendar, or Neurochain
    built-in)

-   OR: Printed picture cards in a velcro strip board

-   A \'done\' pocket or envelope to place completed cards

-   First-Then board

-   Optional: a reward token at the end of the full schedule

**Step-by-Step Instructions**

140. Build a morning or bedtime visual schedule in the app or on the
     physical board. Use the child\'s actual activity photos, not
     generic clip art --- familiarity reduces anxiety.

141. Place the schedule at the child\'s eye level in a consistent,
     permanent location.

142. Morning schedule example: Wake Up → Toilet → Wash Face → Dress →
     Eat Breakfast → Brush Teeth → Bag Check → Go to School. Each step
     is one card/icon.

143. Each morning, walk the child to the schedule and say: \'What is
     first?\' (not \'what do you do now?\' --- always reference the
     schedule, not the parent).

144. After completing a step, child moves the card to the \'done\'
     pocket. This physical act gives a strong sense of completion and
     control.

145. First-Then extension: for highly resistant steps, use a First-Then
     overlay: \'First shoes, then tablet.\' Do not skip or rearrange
     steps.

146. At the end of the full schedule, a reward token is given and the
     whole completed schedule is celebrated: \'You did EVERYTHING!\'

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   SCHEDULE CREATION: Film parent building the schedule in the app   |
|     with child\'s actual photos. Caption: \'Use real photos of YOUR   |
|     child\'s actual routine. Familiar images reduce anxiety.\'        |
|                                                                       |
| -   SCHEDULE WALK-THROUGH: Film a complete morning routine following  |
|     the schedule --- child checks each step, moves the card, proceeds |
|     to the next.                                                      |
|                                                                       |
| -   REFERENCE THE BOARD, NOT YOURSELF: Film the key technique ---     |
|     when child asks \'What\'s next?\', parent POINTS TO THE BOARD     |
|     instead of answering verbally. Caption: \'Transferring authority  |
|     to the schedule builds independence.\'                            |
|                                                                       |
| -   DONE POCKET: Close-up of child sliding completed card into the    |
|     done pocket. This satisfying physical act is the reinforcer.      |
|                                                                       |
| -   MELTDOWN PREVENTION: Film child beginning to protest at a         |
|     transition, and parent redirecting to the schedule (\'Look ---    |
|     what does the board say?\') successfully.                         |
|                                                                       |
| -   VOICE-OVER: \'A visual schedule reduces the cognitive demand of   |
|     transitions by making the future predictable. When the child      |
|     knows what comes next, anxiety drops and compliance rises.\'      |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ---------------------- ------------------------ ------------------------
  **Metric**             **What to Record**       **How to Record**

  **Steps Completed      How many steps did child Tally out of total steps
  Independently**        complete without verbal  
                         reminder?                

  **Transitions Without  How many transitions     Tally per morning
  Protest**              happened without         
                         behavioral resistance?   

  **Independence Level** Did child CHECK the      Independent / Prompted /
                         schedule independently   Could not use schedule
                         (vs. prompted to look)?  
  ---------------------- ------------------------ ------------------------

+-----------------------------------------------------------------------+
| **Activity 4: Feelings Thermometer & Zones Check-In**                 |
|                                                                       |
| Targets: Emotional Awareness, Self-Reporting, Self-Regulation         |
| Strategy Selection, ABLLS-R L (Social Interaction)                    |
+-----------------------------------------------------------------------+

**Materials Needed**

-   Printed or drawn Feelings Thermometer (1--5 scale with colors and
    faces)

-   4 colored zone cards: Blue (low/sad), Green (calm/ready), Yellow
    (worried/silly), Red (angry/out of control)

-   Strategy cards for each zone (calm-down tools)

-   Velcro or sticky tack to attach cards to the thermometer

**Step-by-Step Instructions**

147. Post the Feelings Thermometer on the wall. Review it daily --- not
     only during emotional moments.

148. Zones: Blue = body feels slow, tired, sad. Green = body feels calm,
     focused, ready to learn. Yellow = body feels worried, silly,
     wiggly. Red = body feels out of control, very angry, unsafe.

149. Three times per day (morning, after school, before bed), do a Zones
     Check-In: parent asks \'What zone are you in?\' and child points to
     or says the zone.

150. If child is in Yellow or Red, immediately review the zone\'s
     strategy card: \'You\'re in Yellow. Let\'s look at our Yellow
     strategies.\' Strategies are pre-agreed calming tools.

151. Green zone reinforcement: when child is in Green, narrate: \'You
     are in Green! Your body is calm. This is the best zone for
     learning!\'

152. Generalization: use the Zones language in daily conversation: \'I
     notice your body is getting Yellow. What can we do?\' --- teaches
     the child to self-identify rather than just react.

+-----------------------------------------------------------------------+
| **📹 Video Demonstration Guide**                                      |
|                                                                       |
| **Shot List & Script Prompt for Video Production:**                   |
|                                                                       |
| -   THERMOMETER INTRODUCTION: Film parent explaining each zone and    |
|     color to child using the physical thermometer. Keep it playful    |
|     and descriptive.                                                  |
|                                                                       |
| -   DAILY CHECK-IN: Film a full 3-times-per-day check-in sequence:    |
|     morning / after school / bedtime. Shows how quick (30 seconds)    |
|     each check-in is.                                                 |
|                                                                       |
| -   YELLOW ZONE INTERVENTION: Film a real-time scenario where child   |
|     is getting dysregulated, parent asks \'What zone?\', child        |
|     identifies Yellow, parent pulls the Yellow strategy card.         |
|                                                                       |
| -   GREEN ZONE CELEBRATION: Film parent actively labeling and         |
|     celebrating the Green zone: \'You are in GREEN! I love it when    |
|     your body is calm.\'                                              |
|                                                                       |
| -   LANGUAGE GENERALIZATION: Film parent using Zones language         |
|     naturally: \'I feel a little Yellow today --- my strategy is      |
|     going for a walk.\'                                               |
|                                                                       |
| -   VOICE-OVER: \'Before a child can self-regulate, they must be able |
|     to self-identify their emotional state. The Zones give them a     |
|     vocabulary for feelings that is concrete, visual, and             |
|     actionable.\'                                                     |
+-----------------------------------------------------------------------+

**Parent Tracking Sheet**

  ----------------------- ------------------------ ------------------------
  **Metric**              **What to Record**       **How to Record**

  **Daily Zone Reports**  What zone did child      Record all 3 daily in
                          report in morning /      app
                          afternoon / night?       

  **Accurate              Did parent agree with    Yes / Over-estimated /
  Self-Identification**   child\'s zone            Under-estimated
                          self-report?             

  **Strategy Use**        When in Yellow/Red, did  Yes / With prompt / No
                          child use a pre-agreed   
                          strategy?                
  ----------------------- ------------------------ ------------------------

**Parent Data Collection Framework**

Every off-screen activity in Neurochain generates structured data that
feeds the parent dashboard and clinical reporting system. The following
framework consolidates tracking methodology across all five problem
profiles into a unified system parents can use consistently.

**ABA Prompt Hierarchy Reference**

All activities use the following standardized prompt levels. Parents
record the highest level of support required per trial. A decrease in
prompt level over time is the primary metric of therapeutic progress.

  ---------- ----------------- -------------------------------------------
  **Code**   **Prompt Level**  **Description**

  **FP**     **Full Physical** Parent guides child hand-over-hand through
                               the complete task. Most intrusive.

  **PP**     **Partial         Parent provides a gentle nudge, guides
             Physical**        elbow, or steadies the child\'s hand.

  **G**      **Gestural**      Parent points to the object, the next step,
                               or uses a visual cue without touching.

  **V**      **Verbal**        Parent gives a spoken instruction or hint.
                               No physical guidance.

  **I**      **Independent**   Child completes the task with no prompts.
                               Goal state.
  ---------- ----------------- -------------------------------------------

**Parent Dashboard Data Architecture**

The Neurochain app aggregates all parent-logged session data into the
following dashboard views:

  ---------------- ----------------- ------------- -----------------------
  **Dashboard      **Data Source**   **Update      **Clinical Use**
  View**                             Frequency**   

  Skill Progress   Prompt level per  Per session   Tracks prompt fading →
  Charts           skill per session               independence across all
                   (all profiles)                  domains

  Regulation       Before/after      Per session   Identifies time-of-day
  Heatmap          regulation                      patterns in
                   sliders (Profiles               dysregulation
                   2 & 5)                          

  ABLLS-R          On-screen game    Weekly rollup Visual of 25-category
  Completion Map   accuracy +                      skill grid --- %
                   off-screen                      mastered per category
                   activity tracking               

  Milestone Alerts Auto-generated    Auto-detect   Push notification to
                   when child                      parent + flag for
                   achieves 3×                     clinician review
                   independent on                  
                   any skill                       

  Session          Login + activity  Daily         Ensures therapeutic
  Frequency        completion                      dosage (recommended:
                   timestamps                      1--2 sessions/day)

  Clinician Share  PDF export of all On-demand     Monthly report for
  Report           data above                      therapist/center review
                                                   meeting
  ---------------- ----------------- ------------- -----------------------

**Recommended Tracking Apps (Third-Party)**

While Neurochain\'s built-in tracking covers all activities in this
framework, parents can supplement with the following tools:

  ----------------- ---------------- ---------------------------------------
  **App**           **Platform**     **Best Used For**

  **Catalyst**      iOS/Android      Comprehensive ABA data collection;
                                     discrete trial and NET data

  **Birdhouse for   iOS/Android      Parent-friendly daily behavior &
  Autism**                           progress logging

  **TallyFlex**     iOS/Android      Quick frequency tally counter for
                                     behavior tracking

  **Behavior        iOS              Detailed ABC
  Tracker Pro**                      (Antecedent-Behavior-Consequence)
                                     logging

  **Choiceworks**   iOS              Visual schedule + first-then board +
                                     feelings board

  **Hearth          iOS/Android      Visual schedule with video prompts and
  Calendar**                         reward systems
  ----------------- ---------------- ---------------------------------------
