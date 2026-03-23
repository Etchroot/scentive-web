import { useState, useEffect, useRef } from 'react';

/**
 * 카메라 접근 훅
 * - 페이지 진입 시 getUserMedia로 카메라 권한 요청
 * - 허용 → videoRef에 스트림 연결, cameraGranted = true
 * - 거부/미지원 → cameraGranted = false, 기존 배경 유지
 */
export default function useCamera() {
  const videoRef = useRef(null);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    let stream = null;
    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.muted = true;
    videoRef.current = video;

    if (!navigator.mediaDevices?.getUserMedia) return;

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      .then((s) => {
        stream = s;
        video.srcObject = s;
        return video.play();
      })
      .then(() => setGranted(true))
      .catch(() => {
        /* camera denied or unavailable — fallback to default background */
      });

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    };
  }, []);

  return { videoRef, cameraGranted: granted };
}
