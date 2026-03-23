import { useEffect, useRef } from 'react';

/**
 * MediaPipe Hands 추적 훅
 *
 * - WASM + 모델을 CDN에서 런타임 로드 (번들 사이즈 최소화)
 * - 메인 rAF 루프에서 detectHands(now)를 호출하면 내부적으로 쓰로틀링 처리
 * - handDataRef.current에 최신 추적 데이터 저장
 */

const WASM_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.33/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';
const DETECT_INTERVAL = 50; // ~20 fps 쓰로틀

export default function useHandTracker(videoRef, enabled) {
  const dataRef = useRef({
    tips: [],
    velocity: { x: 0, y: 0 },
    detected: false,
  });
  const landmarkerRef = useRef(null);
  const prevTipRef = useRef(null);
  const lastDetectRef = useRef(0);

  /**
   * 메인 rAF 루프에서 호출 — 충분한 시간이 지났을 때만 실제 검출 실행
   * detectForVideo는 동기 함수이므로 rAF 블로킹 최소화를 위해 쓰로틀링
   */
  const detect = (now) => {
    const lm = landmarkerRef.current;
    const video = videoRef.current;
    if (!lm || !video || video.readyState < 2) return;
    if (now - lastDetectRef.current < DETECT_INTERVAL) return;
    lastDetectRef.current = now;

    try {
      const result = lm.detectForVideo(video, now);
      if (result.landmarks?.length > 0) {
        const hand = result.landmarks[0];
        // 손가락 끝 랜드마크: 엄지=4, 검지=8, 중지=12, 약지=16, 소지=20
        const tips = [4, 8, 12, 16, 20].map((li) => ({
          x: 1 - hand[li].x, // 셀피 모드 좌우 반전
          y: hand[li].y,
        }));

        // 검지 속도 계산
        const indexTip = tips[1];
        let velocity = { x: 0, y: 0 };
        if (prevTipRef.current) {
          velocity = {
            x: indexTip.x - prevTipRef.current.x,
            y: indexTip.y - prevTipRef.current.y,
          };
        }
        prevTipRef.current = { x: indexTip.x, y: indexTip.y };
        dataRef.current = { tips, velocity, detected: true };
      } else {
        prevTipRef.current = null;
        dataRef.current = {
          tips: [],
          velocity: { x: 0, y: 0 },
          detected: false,
        };
      }
    } catch {
      // 프레임 불량 등으로 검출 실패 — 무시
    }
  };

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      try {
        const { HandLandmarker, FilesetResolver } = await import(
          '@mediapipe/tasks-vision'
        );
        if (cancelled) return;

        const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
        if (cancelled) return;

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;
      } catch (e) {
        console.warn('Hand tracking unavailable:', e);
      }
    })();

    return () => {
      cancelled = true;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, [enabled]);

  return { handDataRef: dataRef, detectHands: detect };
}
