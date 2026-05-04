You know that there was a feature as "AI Behavioral Check" in parent portal. We tried to implement that feature in many ways but did not worked well. As we do not have so many time and we need to show the prototype to the judge in 2 days. So we decided to do it in simple way. Parent record video in their own device camera according to our instruction(A new page will open when click Start Ai check Up on parent dashboard , there will be 4 input filed for video with instruction how to record which video) --> parent will upload there --> upload the videos in gemini --> analysis ---> then analysis will store in supabase db.... here is the full details. 
Record Video + Gemini Free Tier (Recommended)

*How it works:*
1. Parent records each task as a short video (expo-camera already has recordAsync())
2. Parent watches it back, retakes if needed
3. On confirm, video uploads to *Google Gemini 1.5 Flash*
4. Gemini watches the video and returns structured behavioral observations
5. Video is deleted from Gemini servers immediately after
6. Only the observations are stored on device

*Why Gemini and not anything else:*

| | What It Can See |
|---|---|
| expo-camera face detection | Head yaw angle, smile probability, eye openness — face only, no body |
| *Gemini 1.5 Flash* | Full body, arms, eye contact with person (not camera), social smile vs spontaneous smile, following a pointed finger, repetitive movements, social context |

Gemini actually watches the video the way a human would. It can tell the difference between a child smiling at their parent vs smiling at a toy. expo-camera cannot.

*Free tier limits:*
- 15 requests per minute
- 1,500 requests per day
- Supports video up to 1 hour
- 4 tasks × 1.5 minutes each = 4 API calls per screening
- You can do *375 full screenings per day* before hitting any limit
- Cost: *$0*

*Privacy handling:*
- Google AI Studio API (not consumer Gemini) — data is NOT used for model training per their API terms
- Video is deleted from Gemini servers after analysis (we call the delete endpoint explicitly)
- Parent sees a consent screen before any upload: "Your video is sent to Google's AI for analysis only, then immediately deleted. NeuroChain never stores your video."
- Only the text observations are saved locally in SQLite

*What Gemini can detect per task:*


Task 1 — Name Response:
  "At ~15 seconds, child's name was spoken. Child oriented
   toward the voice within 2 seconds: YES / NO / PARTIAL"

Task 2 — Free Play:
  "Repetitive arm movements detected: YES (frequent) / NO"
  "Child appeared engaged with objects: YES / NO"

Task 3 — Face Interaction:
  "Child made eye contact with parent's face: YES / NO"
  "Social smile (in response to parent) detected: YES / NO"

Task 4 — Joint Attention:
  "Child followed pointing gesture: YES / NO"
  "Shared gaze with parent after pointing: YES / NO"


*New packages needed:* Zero. Use fetch() to call Gemini API. Already have expo-camera for recording and expo-av for playback.