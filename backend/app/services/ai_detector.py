"""Bhumi Survey 3D - AI Building Detector Service"""

import base64
import io


def detect_buildings(image_bytes: bytes) -> dict:
    try:
        import cv2
        import numpy as np

        arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            return {"error": "Could not decode image"}

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        buildings = []
        for i, c in enumerate(contours):
            area = cv2.contourArea(c)
            if area < 1000:
                continue
            x, y, w, h = cv2.boundingRect(c)
            approx = cv2.approxPolyDP(c, 0.02 * cv2.arcLength(c, True), True)
            if len(approx) >= 4 and len(approx) <= 10:
                height_est = round(h * 0.05, 1)
                floors_est = max(1, int(height_est / 3.5))
                buildings.append({
                    "id": i + 1,
                    "x": int(x), "y": int(y),
                    "width": int(w), "height": int(h),
                    "area": int(area),
                    "estimated_height_m": height_est,
                    "estimated_floors": floors_est,
                    "type": "residential" if area < 5000 else "commercial",
                    "confidence": round(min(97.0, 70 + area / 2000), 1),
                })

        return {
            "total_detected": len(buildings),
            "buildings": buildings[:20],
            "image_width": img.shape[1],
            "image_height": img.shape[0],
        }
    except ImportError:
        return _stub_detection()
    except Exception as e:
        return {"error": str(e)}


def _stub_detection() -> dict:
    return {
        "total_detected": 3,
        "buildings": [
            {"id": 1, "x": 100, "y": 80, "width": 120, "height": 200, "area": 24000, "estimated_height_m": 10.0, "estimated_floors": 3, "type": "residential", "confidence": 89.5},
            {"id": 2, "x": 300, "y": 120, "width": 80, "height": 150, "area": 12000, "estimated_height_m": 7.5, "estimated_floors": 2, "type": "commercial", "confidence": 84.2},
            {"id": 3, "x": 500, "y": 60, "width": 160, "height": 280, "area": 44800, "estimated_height_m": 14.0, "estimated_floors": 4, "type": "residential", "confidence": 92.1},
        ],
        "image_width": 800,
        "image_height": 600,
        "note": "OpenCV not installed - using stub results",
    }