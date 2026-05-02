/**
 * BackgroundCamera — Silent AI Vision Monitor for Premium Sessions
 *
 * Mounts a 1×1 px front-facing CameraView so expo-camera's native face detector
 * runs at 10 fps during therapy games. The child sees nothing. All processing is
 * on-device (see visionEngine.ts for the HIPAA / privacy rationale).
 *
 * Usage:
 *   const cameraRef = useRef<BackgroundCameraHandle>(null);
 *   <BackgroundCamera ref={cameraRef} onFrameAnalyzed={handleFrame} />
 *   // on game end:
 *   const metrics = cameraRef.current?.getMetrics();
 *
 * The CameraView MUST be rendered in the component tree for face detection to work;
 * setting width/height to 1 keeps it invisible without unmounting it.
 */

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

// See WaitingGame.tsx for the same cast rationale (expo-camera v15 type gap)
const FaceCamera = CameraView as any;
import {
  buildFrameFromDetection,
  computeSessionMetrics,
  FaceFrame,
  VisionSessionMetrics,
} from '../engine/visionEngine';

export interface BackgroundCameraHandle {
  /** Returns aggregated behavioral metrics for the current session */
  getMetrics: () => VisionSessionMetrics;
  /** Returns raw frame buffer (for advanced callers like WaitingGame) */
  getFrames: () => FaceFrame[];
  /** Clears accumulated frames — call before a new bid cycle */
  clearFrames: () => void;
}

interface BackgroundCameraProps {
  /**
   * Called synchronously after each face-detection frame (~100ms cadence).
   * Use this for real-time gaze gates (e.g. WaitingGame bid detection).
   * Do NOT call setState inside this callback from a render loop — use refs.
   */
  onFrameAnalyzed?: (frame: FaceFrame) => void;
}

export const BackgroundCamera = forwardRef<BackgroundCameraHandle, BackgroundCameraProps>(
  ({ onFrameAnalyzed }, ref) => {
    const [permission, requestPermission] = useCameraPermissions();
    const framesRef = useRef<FaceFrame[]>([]);

    useEffect(() => {
      if (!permission?.granted) {
        requestPermission();
      }
    }, []);

    useImperativeHandle(ref, () => ({
      getMetrics: () => computeSessionMetrics(framesRef.current),
      getFrames: () => [...framesRef.current],
      clearFrames: () => { framesRef.current = []; },
    }));

    const handleFacesDetected = (result: any) => {
      const frame = buildFrameFromDetection(result);
      framesRef.current.push(frame);
      onFrameAnalyzed?.(frame);
    };

    // No permission yet — render nothing; requestPermission was called above
    if (!permission?.granted) return null;

    return (
      // Position absolute at top-left, 1×1 px — fully covered by game content,
      // invisible to child, but CameraView is mounted so face detection runs.
      <View style={styles.hidden} pointerEvents="none">
        <FaceCamera
          style={styles.camera}
          facing="front"
          onFacesDetected={handleFacesDetected}
          faceDetectorSettings={{
            mode: 'fast',
            detectLandmarks: 'none',
            runClassifications: 'all',
            minDetectionInterval: 100,
            tracking: true,
          }}
        />
      </View>
    );
  },
);

BackgroundCamera.displayName = 'BackgroundCamera';

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    overflow: 'hidden',
    zIndex: -1,
  },
  camera: {
    width: 1,
    height: 1,
  },
});
