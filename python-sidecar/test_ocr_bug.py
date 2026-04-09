import cv2
import easyocr

video_path = r"C:\Users\Administrator\Downloads\_stewie.mp4"
region = {"x": 240, "y": 660, "w": 800, "h": 76} # Approximated from screenshot

# Initialize reader with Chinese and English
reader = easyocr.Reader(['ch_sim', 'en'])
reader_en = easyocr.Reader(['en'])

cap = cv2.VideoCapture(video_path)
cap.set(cv2.CAP_PROP_POS_FRAMES, 50) # 2 seconds in
ret, frame = cap.read()

if ret:
    x, y, w, h = region['x'], region['y'], region['w'], region['h']
    crop = frame[y:y+h, x:x+w]
    
    cv2.imwrite("crop_test.jpg", crop)
    
    print("----- CH_SIM + EN MODEL -----")
    results = reader.readtext(crop, detail=0, paragraph=True)
    print(" ".join(results))
    
    print("----- EN ONLY MODEL -----")
    results_en = reader_en.readtext(crop, detail=0, paragraph=True)
    print(" ".join(results_en))
    
cap.release()
